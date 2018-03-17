import os.path
import re
import traceback

import markdown2 as markdown_module

from django.shortcuts import render
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseRedirect
from django.views.decorators.csrf import csrf_protect
from django.utils.safestring import mark_safe

from django.conf import settings
from r2lab.settings import logger, sidecar_url

"""
Initially a simple view to translate a .md into html on the fly

with the reasonable addition of being able to define metavars at the beginning of the file
e.g.
title: the title for this page

Over time I've added features between << >> that suggest either
* the django templating system
* or markdown extensions

I'm sticking with the current approach for now though, because
all these things are quite fragile and using something entirely different
looks a little scary / time-consuming

"""

# pages that require login sohuld define the 'require_login' metavar

# search for markdown input in the markdown/ subdir
# and code in the "code/" subdir
# xxx should be configurable
markdown_subdir = "markdown"
code_subdir = "code"
templates_subdir = "templates"
include_paths = [ markdown_subdir, templates_subdir, code_subdir ]
    
# accept names in .html or .md or without extension
def normalize(filename):
    """
    returns foo.md for an input that would be either foo, foo.md or foo.html
    """
    # do not support the .html extension now that we've migrated away from the old website
    #return filename.replace(".md", "").replace(".html", "") + ".md"
    return filename.replace(".md", "") + ".md"

##########
metavar_re = re.compile("\A(?P<name>[\S_]+):\s*(?P<value>.*)\Z")

def match_meta(line):
    """
    for parsing the header that defines metavariables
    returns a tuple (name, value), or None 
    """
    # remove trailing newline
    match = metavar_re.match(line[:-1])
    if match:
        return match.group('name'), match.group('value')

def parse(markdown_file):
    """
    parse markdown content for
    * metavars
    * << tags >>
    returns a tuple metavars, markdown

    Supported tags

    << include file >>
       -> raw include 

    << codediff uniqueid file1 file2 >>
       -> a single visible <pre> (with 2 invisible ones) 
          that shows the differences between both files
          the uniqueid should indeed be unique

    << codeview uniqueid main [previous=filename] [graph=filename] [selected=plain|diff|graph] >>
       -> a navpills <ul> with 
          * a 'plain' option tab that shows the main file 
            (this amounts to one <<include>>)
          * if previous is set, a 'diff' tab to show the differences between previous and main
            (this mounts to one <<codediff>>
          * if graph is set, a 'graph' tab to display the image
       The default tab can be set with the selected= tag; if not specified, it is
          * the diff tab if previous is set
          * the plain tab otherwise
    """
    metavars = {}
    markdown = ""
    absolute_path = os.path.join(settings.BASE_DIR, markdown_subdir, markdown_file)
    with open(absolute_path, encoding='utf-8') as file:
        in_header = True
        for lineno, line in enumerate(file):
            if in_header:
                name_value_or_none = match_meta(line)
                if name_value_or_none:
                    name, value = name_value_or_none
                    metavars[name] = value
                    continue
                else:
                    in_header = False
            markdown += line
    return metavars, markdown

def resolve_tags(input):
    # deal with supported tags
#    print("XXXXXXXXXXXXXXXXXXXX IN ", input)
    input = resolve_includes (input)
    input = resolve_codediffs(input)
    input = resolve_codeviews(input)
#    print("XXXXXXXXXXXXXXXXXXXX OUT ", input)
    return input

####################
# when searching for our tags,
# because this happens **after** markdown has triggered
# we can typically find:
# &lt;<  instead of << - and sometimes even <p>&lt;
# and
# >&gt; or >&gt;</p> instead of >>
def post_markdown(pattern):
    return pattern\
        .replace("<<", "(<p>)?(&lt;|<)(&lt;|<)")\
        .replace(">>", "(&gt;|>)(&gt;|>)(</p>)?")


re_include = re.compile(post_markdown(
    r'<<\s*include\s+(?P<file>\S+)\s*>>\s*\n'))
def resolve_includes(markdown):
    """
    Looks for << include file >> tags and resolves them
    """
    end = 0
    resolved = ""
    for match in re_include.finditer(markdown):
        filename = match.group('file')
        resolved = resolved + markdown[end:match.start()]
        resolved += implement_include(filename, "include")
        end = match.end()
    resolved = resolved + markdown[end:]
    # print("resolve_includes <- {} chars".format(len(resolved)))
    return resolved


re_codediff = re.compile(post_markdown(
    r'<<\s*codediff\s+(?P<id>\S+)\s+(?P<file1>\S+)(\s+(?P<file2>\S+))\s*>>\s*\n'))
def resolve_codediffs(markdown):
    """
    looks for << codediff id file1 file2 >> for inline inclusion and differences

    id should be unique identifier for that codediff, and
       will be used to attach ids to the DOM elements, and link them with the js code

    file1 and file2 are mandatory

    this features relies on 
      * diff.js from http://kpdecker.github.io/jsdiff/diff.js
      * related style
      * our own wrapper r2lab-diff.js     
    """
    end = 0
    resolved = ""
    for match in re_codediff.finditer(markdown):
        id, f1, f2 = match.group('id'), match.group('file1'), match.group('file2')
        resolved = resolved + markdown[end:match.start()]
        resolved += implement_codediff(id, f1, f2)
        end = match.end()
    resolved = resolved + markdown[end:]
    return resolved
                      


re_codeview = re.compile(post_markdown(
    r'<<\s*codeview\s+(?P<id>\S+)\s+(?P<main>\S+)(?P<tags>(\s+\S+=\S+)*)\s*>>\s*\n'))
re_codeview_tags = re.compile(r'(?P<tag>\S+)=(?P<value>\S+)')

def resolve_codeviews(markdown):
    """
    looks for << codeview id file1 [file2] >> and shows a nav-pills bar
    with 2 components 'plain' and 'diff'
    except if file2 is ommitted, in which case only the 'plain' button shows up

    in other words this essentially shows 
    the result of <<include>> and <<codediff>> in a togglable env

    """
    end = 0
    resolved = ""
    allowed_tags = ['selected', 'graph', 'previous', 'lang']
    kwds = {}
    for match in re_codeview.finditer(markdown):
        id, main, tags = match.group('id'), match.group('main'), match.group('tags')
        for tagvalue in tags.split():
            match2 = re_codeview_tags.match(tagvalue)
            if not match2:
                raise ValueError(f"ill-formed tag in codeview {tagvalue}")
            tag, value = match2.group('tag'), match2.group('value')
            if tag not in allowed_tags:
                raise ValueError(f"ill-formed tag in codeview {tagvalue} - {tag} not allowed")
            kwds[tag] = value
        resolved = resolved + markdown[end:match.start()]
        resolved += implement_codeview(id, main, **kwds)
        end = match.end()
    resolved = resolved + markdown[end:]
    return resolved


####################
# could not figure out how to do this with the template engine system....
def implement_include(f, tag):
    if not f:
        return ""
    for path in include_paths:
        p = os.path.join(settings.BASE_DIR, path, f)
        try:
            # print("implement_include : trying", p)
            with open(p) as i:
                # print("implement_include: using p=", p)
                return i.read()
        except:
            pass
    return "**include file {} not found in {} tag**".format(f, tag)



def implement_codediff(id, f1, f2, lang='python'):
    """
    the html code to generate for one codediff
    """

    i1, i2 = implement_include(f1, 'codediff'), implement_include(f2, 'codediff')

    ########## two files must be provided
    result = ""
    # create 2 invisible <pres> for storing both contents
    result += '<pre id="{id}_a" style="display:none">{i1}</pre>\n'\
                .format(id=id, i1=i1)
    result += '<pre id="{id}_b" style="display:none">{i2}</pre>\n'\
                 .format(id=id, i2=i2)
    # create a <pre> to receive the result
    result += '<pre id="{id}_diff" class="r2lab-diff"></pre>\n'\
                .format(id=id)
    # arm a callback for when the document is fully loaded
    # this callback with populate the <pre> tag with elements
    # tagges either <code>, <ins> or <del> 
    result += '<script>$(function(){{r2lab_diff("{id}", "{lang}");}})</script>\n'\
                .format(id=id, lang=lang)
    
    return result


def implement_codeview(id, main, *, previous=None, selected=None, graph=None, lang='python'):
    """
    Arguments:
        main: is the filename that contains the code for that section
        previous: if set is the filename that contains the previous code, may be None
       
        selected: = 'plain' | 'diff' | 'graph'
          typically the selected tab is either 
            * plain code if previous is not provided
            * the diff pane if previous is provided
          setting selected='plain' allows to force with the plain code
          when both files are provided
        graph: if provided, is expected to be the filename of a png or other image source
          that shows up in a last pane

    Returns:
        the html code to generate for one codeview
    """

    result = ""
    sections = {'plain', 'diff', 'graph'}

    # for a section, the classes for the header and the body/content divs
    sections_classes = { section: ('', '') for section in sections}

    # selected not specified by caller, let's figure the default
    if selected not in sections:
        # depends only on whether we have a previous or not
        selected = 'diff' if previous else 'plain'
    # this is how to tag the section that we start with
    sections_classes[selected] = ('active', 'in active')
        

    ########## the headers (nav pills) for the various tabs
    
    plain_header_class, plain_body_class = sections_classes['plain']
    diff_header_class, diff_body_class = sections_classes['diff']
    graph_header_class, graph_body_class = sections_classes['graph']

    result += '<ul class="nav nav-pills">\n'

    # the pill for the plain tab
    result += f'<li class="{plain_header_class}"><a href="#view-{id}-plain" title="Display {main}">{main}</a></li>\n'

    # the pill for the download tab
    result += f'''<li class="navbar-right">
 <a class="default-click" href="/code/{main}" download target="_blank" title="Download {main}">
  <span class='fa fa-cloud-download'></span> {main}
 </a>
</li>\n'''

    # the pill for the graph contents
    if graph:
        result += f'''<li class="{graph_header_class}">
 <a href="#view-{id}-graph" title="Display jobs graph for {main}">
  Graph <span class="fa fa-compass"></span>
 </a>
</li>'''

    # the tab for diff contents
    if previous:
        result += f'''<li class="{diff_header_class}">
 <a href="#view-{id}-diff" title="Outline diffs from {previous} to {main}">{previous} ➾ {main}</a></li>\n'''

        
    result += "</ul>"


    ########## the contents of the various tabs

    result += '<div class="tab-content" markdown="0">\n'
    
    ### plain
    result += f'<div id="view-{id}-plain" class="tab-pane fade {plain_body_class}" markdown="0">'
    result += f'<pre>\n'
    result += implement_include(main, "codeview")
    result += f'</pre>\n'
    result += f'</div>'

    ### graph
    if graph:
        result += f'<div id="view-{id}-graph" class="tab-pane fade {graph_body_class}">'
        result += f'<img src="/assets/code/{graph}" style="max-width:100%;">'
        result += f'</div>'

    ### diff
    if previous:
        result += f'<div id="view-{id}-diff" class="tab-pane fade {diff_body_class}" markdown="0">'
        result += implement_codediff('diff-'+id, previous, main, lang=lang)
        result += f'</div>'

    result += "</div><!-- pills targets-->"
    return result


####################
@csrf_protect
def markdown_page(request, markdown_file, extra_metavars={}):
    """
    the view to render a URL that points at a markdown source
    e.g.
    if markdown_file is 'index' - or 'index.md', then we
     * look for the file markdown/index.md
     * extract any metavar in its header - they get passed to the template
     * and expand markdown to html - passed to the template as 'html_from_markdown'
    additional metavars can be passed along as well if needed
    """
    logger.info("Rendering markdown page {}".format(markdown_file))
    try:
        markdown_file = normalize(markdown_file)
        ### fill in metavars: 'title', 'html_from_markdown',
        # and any other defined in header
        metavars, markdown = parse(markdown_file)
        # convert markdown
        html = markdown_module.markdown(markdown, extras=['markdown-in-html'])
        # handle our tags
        html = resolve_tags(html)
        # and mark safe to prevent further escaping
        metavars['html_from_markdown'] = mark_safe(html)
        # set default for the 'title' metavar if not specified in header
        if 'title' not in metavars:
            metavars['title'] = markdown_file.replace(".md", "")
        # define the 'r2lab_context' metavar from current session
        r2lab_context = request.session.get('r2lab_context', {})
        if not r2lab_context and 'require_login' in metavars:
                return HttpResponseRedirect("/index.md")
        metavars['r2lab_context'] = r2lab_context
        metavars['sidecar_url'] = sidecar_url
        metavars.update(extra_metavars)
        return render(request, 'r2lab/r2lab.html', metavars)
    except Exception as e:
        error_message = "<h1> Oops - cannot render markdown</h1>"\
            .format(markdown_file)
        if isinstance(e, FileNotFoundError):
            # turned off following an advice from inria's security cell
            # error_message += str(e)
            error_message += " file not found"
        else:
            stack = traceback.format_exc()
            logger.info("Storing stacktrace in previous_message - {}".format(stack))
            error_message += "<pre>\n{}\n</pre>".format(stack)
        error_message = mark_safe(error_message)
        if settings.DEBUG:
            return HttpResponseNotFound(error_message)
        else:
            return markdown_page(request, 'oops', {'previous_message': error_message})
