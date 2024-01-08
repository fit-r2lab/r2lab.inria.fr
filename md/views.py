"""
entry point for rendering a markdown file as html

mostly concerned with expanding our local macros like << codeview ... >>>
"""

# pylint: disable=r1705

from pathlib import Path
import re
import traceback

# WARNING: version 2.3.6 of markdown2 breaks it for me
# see https://github.com/trentm/python-markdown2/issues/311
import markdown2 as markdown_module

from django.shortcuts import render
from django.http import HttpResponseNotFound, HttpResponseRedirect
from django.views.decorators.csrf import csrf_protect
from django.utils.safestring import mark_safe

from django.conf import settings
from r2lab.settings import logger, sidecar_url

"""
Initially a simple view to translate a .md into html on the fly

with the reasonable addition of being able to define metavars
at the beginning of the file
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
MARKDOWN_SUBDIR = "markdown"
INCLUDE_PATHS = [
    MARKDOWN_SUBDIR,
    "templates",
    "code",
    "assets/code",
]

METAVAR_RE = re.compile(r"\A(?P<name>[\S_]+):\s*(?P<value>.*)\Z")


def normalize(filename):
    """
    returns foo.md for an input that would be either foo, foo.md or foo.html
    """
    return filename.replace(".md", "") + ".md"


def match_meta(line):
    """
    for parsing the header that defines metavariables
    returns a tuple (name, value), or None
    """
    # remove trailing newline
    match = METAVAR_RE.match(line[:-1])
    if match:
        return match.group('name'), match.group('value')
    return None


def parse(markdown_file):
    """
    parse markdown content for
    * metavars
    * << tags >>
    returns a tuple metavars, markdown

    Supported tags (on a single line)

    << include file >>
       -> raw include

    << tuto_tabs ID1->"title 1" ... IDn->"title n" >>
        -> a bootstrap tabs-based <nav> that shows the various parts
           in that tuto page
           this includes the 'tutorial_index' as the last rightmost dropdown
           each ID should then be defined in a subsequent <div id="ID">
        the first ID is considered active, active-tab.js
           is in charge of tweaking that if needed

    <<togglableoutput file header>>
       -> raw include inside a collapsible

    << codediff uniqueid file1 file2 >>
       -> a single visible <pre> (with 2 invisible ones)
          that shows the differences between both files
          the uniqueid should indeed be unique

    << codeview uniqueid main
       [previous=filename]
       [graph=filename]
       [selected=plain|diff|graph] >>
       -> a bootstrap pills-based <nav> with
          * a 'plain' option tab that shows the main file
            (this amounts to one <<include>>)
          * if previous is set, a 'diff' tab to show the differences
            between previous and main
            this amounts to one <<codediff>>
          * if graph is set, a 'graph' tab to display the image

       The default tab can be set with the selected= tag; if not specified,
       it is
          * the diff tab if previous is set
          * the plain tab otherwise

    """
    metavars = {}
    markdown = ""
    absolute_path = Path(settings.BASE_DIR) / MARKDOWN_SUBDIR / markdown_file
    with absolute_path.open(encoding='utf-8') as file:
        in_header = True
        for _, line in enumerate(file):
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


def resolve_tags(incoming):
    """
    deal with supported tags
    """
#    print("XXXXXXXXXXXXXXXXXXXX IN ", incoming)
    incoming = resolve_includes(incoming)
    incoming = resolve_tuto_tabs(incoming)
    incoming = resolve_codediffs(incoming)
    incoming = resolve_togglables(incoming)
    incoming = resolve_codeviews(incoming)
#    print("XXXXXXXXXXXXXXXXXXXX OUT ", incoming)
    return incoming


####################
def post_markdown(pattern):
    """
    when searching for our tags,
    because this happens **after** markdown has triggered
    we can typically find:
    &lt;<  instead of << - and sometimes even <p>&lt;
    and
    >&gt; or >&gt;</p> instead of >>
    """
    return pattern\
        .replace("<<", "(<p>)?(&lt;|<)(&lt;|<)")\
        .replace(">>", "(&gt;|>)(&gt;|>)(</p>)?")


def resolve_includes(markdown):
    """
    Looks for << include file >> tags and resolves them
    """
    re_include = re.compile(post_markdown(
        r'<<\s*include\s+(?P<file>\S+)\s*>>\s*\n'))
    end = 0
    resolved = ""
    for match in re_include.finditer(markdown):
        filename = match.group('file')
        resolved += markdown[end:match.start()]
        resolved += implement_include(filename, "include")
        end = match.end()
    resolved += markdown[end:]
    # print("resolve_includes <- {} chars".format(len(resolved)))
    return resolved


def resolve_tuto_tabs(markdown):
    id_def = r'"([^"]*)":(\w*)'
    re_id_def = re.compile(id_def)
    id_defs = rf"(?P<id_defs>({id_def})(\s+{id_def})*)"
    pattern = rf'<<\s*tuto_tabs\s+{id_defs}\s*>>\s*\n'
    print(pattern)
    re_tuto_tabs = re.compile(post_markdown(pattern))
    end = 0
    resolved = ""
    id_titles = []
    for match in re_tuto_tabs.finditer(markdown):
        id_defs = match.group('id_defs')
        print(f"id_defs={id_defs}")
        for title, divid in re_id_def.findall(id_defs):
            # use same title & divids if omitted
            divid = divid or title
            id_titles.append((divid, title))
        resolved += markdown[end:match.start()]
        resolved += implement_tuto_tabs(id_titles)
        end = match.end()
    resolved += markdown[end:]
    # print("resolve_includes <- {} chars".format(len(resolved)))
    return resolved


def resolve_codediffs(markdown):
    """
    looks for << codediff id file1 file2 >> for inline inclusion
    and differences

    viewid should be unique identifier for that codediff, and will be used
    to name (with id=)DOM elements, and link them with the js code

    file1 and file2 are mandatory

    this features relies on
      * diff.js from http://kpdecker.github.io/jsdiff/diff.js
      * related style
      * our own wrapper r2lab-diff.js
    """
    re_codediff = re.compile(post_markdown(
        r'<<\s*codediff\s+(?P<viewid>\S+)'
        r'\s+(?P<file1>\S+)(\s+(?P<file2>\S+))\s*>>\s*\n'))
    end = 0
    resolved = ""
    for match in re_codediff.finditer(markdown):
        viewid = match.group('viewid')
        file1, file2 = match.group('file1'), match.group('file2')
        resolved += markdown[end:match.start()]
        resolved += implement_codediff(viewid, file1, file2)
        end = match.end()
    resolved += markdown[end:]
    return resolved


def resolve_togglables(markdown):
    """
    search for << togglableoutput viewid file "possibly multiword header" >>

      file is mandatory

      header must be enclosed inside double quotes

    rendered using bootstrap panels; requires togglable.css
    """
    re_togglable = re.compile(post_markdown(
        r'<<\s*togglableoutput\s+(?P<viewid>\S+)'
        r'\s+(?P<file>\S+)(\s+"(?P<header>[^"]*)")\s*>>\s*\n'))
    end = 0
    resolved = ""
    for match in re_togglable.finditer(markdown):
        viewid = match.group('viewid')
        file, header = match.group('file'), match.group('header')
        resolved += markdown[end:match.start()]
        # always start non expanded for now
        resolved += implement_togglable(viewid, file, header, False)
        end = match.end()
    resolved += markdown[end:]
    return resolved


def resolve_codeviews(markdown):
    """
    looks for << codeview id file1 [file2] >> and shows a nav-pills bar
    with 2 components 'plain' and 'diff'
    except if file2 is ommitted, in which case only the 'plain' button shows up

    in other words this essentially shows
    the result of <<include>> and <<codediff>> in a togglable env

    """
    re_codeview = re.compile(post_markdown(
        r'<<\s*codeview\s+(?P<viewid>\S+)\s+'
        r'(?P<main>\S+)(?P<tags>(\s+\S+=\S+)*)\s*>>\s*\n'))
    re_codeview_tags = re.compile(r'(?P<tag>\S+)=(?P<value>\S+)')
    end = 0
    resolved = ""
    allowed_tags = ['selected', 'graph', 'previous', 'lang', 'previous_graph']
    for match in re_codeview.finditer(markdown):
        kwds = {}
        viewid, main = match.group('viewid'), match.group('main')
        tags = match.group('tags')
        for tagvalue in tags.split():
            match2 = re_codeview_tags.match(tagvalue)
            if not match2:
                raise ValueError(f"ill-formed tag in codeview {tagvalue}")
            tag, value = match2.group('tag'), match2.group('value')
            if tag not in allowed_tags:
                raise ValueError(f"ill-formed tag in codeview {tagvalue}"
                                 " - {tag} not allowed")
            kwds[tag] = value
        resolved += markdown[end:match.start()]
        resolved += implement_codeview(viewid, main, **kwds)
        end = match.end()
    resolved += markdown[end:]
    return resolved


def implement_include(filename, tag):
    """
    could not figure out how to do this with the template engine system....
    """
    if not filename:
        return ""
    for path in INCLUDE_PATHS:
        fullpath = Path(settings.BASE_DIR) / path / filename
        try:
            with fullpath.open() as i:
                return i.read()
        except IOError:
            pass
    return "**include file {} not found in {} tag**".format(filename, tag)


def implement_tuto_tabs(id_titles):
    """
    implement the tabs header part for a standard tutorial page
    id_titles is a list of tuples (divid, title)
    title is what shows up in the tabs
    divid is the DOM id of the div that is made visible when this tab is clicked
    """
    result = ""
    result += f'''<div class="mx-auto">
    <ul class="nav nav-tabs" role="tablist">'''

    for index, (divid, title) in enumerate(id_titles):
        klass = "active" if not index else ""
        result += f'''<li class="nav-item"><a class="nav-link {klass}"
data-toggle="tab" href="#{divid}" role="tab">{title}</a></li>'''

    result += implement_include('r2lab/tutos-index.html', 'include')
    result += f'</ul></div>'

    return result


def implement_codediff(viewid, file1, file2, lang='python'):
    """
    the html code to generate for one codediff
    """

    inc1 = implement_include(file1, 'codediff')
    inc2 = implement_include(file2, 'codediff')

    # two files must be provided
    result = ""
    # create 2 invisible <pres> for storing both contents
    result += f'<pre id="{viewid}_a" style="display:none">{inc1}</pre>\n'
    result += f'<pre id="{viewid}_b" style="display:none">{inc2}</pre>\n'
    # create a <pre> to receive the result
    result += f'<pre id="{viewid}_diff" class="r2lab-diff"></pre>\n'
    # arm a callback for when the document is fully loaded
    # this callback with populate the <pre> tag with elements
    # tagges either <code>, <ins> or <del>
    result += '<script>'
    result += f'$(function(){{r2lab_diff("{viewid}", "{lang}");}})'
    result += '</script>'

    return result


def implement_togglable(viewid, file, header, start_expanded):
    """
    implements togglables

    for now this is hardwired to start in collapsed mode
    """
    if start_expanded:
        class_a = ""
        class_div = " in"
    else:
        class_a = " collapsed"
        class_div = ""
    result = ''
    result += f'''
<div class="container">
  <div class="panel-group" id="togglable-{viewid}">
    <div class="panel panel-default">
      <div class="panel-heading">
        <h4 class="panel-title">
          <a data-toggle="collapse" data-parent="#togglable-{viewid}"
            href="#{viewid}-togglable-contents" class="panel-label togglable{class_a}">
'''
    result += f'<code title="click to hide / show the output area">{header}</code>'
    result += f'''
            </a>
        </h4>
      </div><!--/.panel-heading -->
      <div id="{viewid}-togglable-contents" class="panel-collapse collapse{class_div}">
        <div class="panel-body">
          <pre><code>
'''
    result += implement_include(file, "togglableoutput")
    result += f'''
          </code></pre>
        </div><!--/.panel-body -->
      </div><!--/.panel-collapse -->
    </div><!-- /.panel -->
  </div><!-- /.panel-group -->
</div><!-- /.container -->
'''
    return result

def implement_codeview(viewid, main, *,                 # pylint: disable=r0914
                       previous=None, selected=None,
                       graph=None, previous_graph=None,
                       lang='python'):
    """
    Arguments:
      main: is the filename that contains the code for that section
      previous: if set is the filename that contains the previous code,
        may be None
      selected: = 'plain' | 'diff' | 'graph'
        typically the selected tab is either
          * plain code if previous is not provided
          * the diff pane if previous is provided
        setting selected='plain' allows to force with the plain code
        when both files are provided
      graph: if provided, is expected to be the filename of a png
        or other image source that shows up in the graph pane

    Returns:
        the html code to generate for one codeview
    """

    result = ""
    sections = {'plain', 'diff', 'graph', 'previous_graph'}

    # for a section, the classes for the header and the body/content divs
    sections_classes = {section: ('', '') for section in sections}

    # selected not specified by caller, let's figure the default
    if selected not in sections:
        # depends only on whether we have a previous or not
        selected = 'diff' if previous else 'plain'
    # this is how to tag the section that we start with
    sections_classes[selected] = ('active', 'show active')

    # the headers (nav pills) for the various tabs
    plain_header_class, plain_body_class = sections_classes['plain']
    diff_header_class, diff_body_class = sections_classes['diff']
    graph_header_class, graph_body_class = sections_classes['graph']
    previous_graph_header_class, previous_graph_body_class = \
        sections_classes['previous_graph']

    result += f'''<nav class="navbar navbar-expand-md">'''

    # pill for the right-hand-side download tab
    result += f'''
<div class="navbar-collapse collapse w-100 order-2 dual-collapse2">
<ul class="nav nav-pills ml-auto">
<li class="nav-item">
<a class="nav-link default-click" href="/code/{main}"
download target="_blank" title="Download {main}">
<span class='fa fa-cloud-download'></span> {main}
</a>
</li></ul></div>'''

    # the left-hand-side group of buttons
    result += f'''
<div class="navbar-collapse collapse w-100 order-1 dual-collapse2">
<ul class="nav nav-pills mr-auto">'''

    def button(klass, label, title, hrefid):
        return f'''<li class="nav-item">
<a class="nav-link {klass}" href="#{hrefid}" title="{title}">{label}</a></li>'''

    # pill for graphical view
    if graph:
        result += button(graph_header_class,
                         'Graph <span class="fa fa-compass"></span>',
                         f"Display jobs graph for {main}",
                         f"view-{viewid}-graph")

    # pill for plain code tab
    result += button(plain_header_class, main,
                     f"Display {main}", f"view-{viewid}-plain")

    # pill for diff contents
    if previous:
        result += button(diff_header_class,
                         f"{previous} ➾ {main}",
                         f"Outline diffs from {previous} to {main}",
                         f"view-{viewid}-diff")

    # pill for the previous graph if provided
    if previous_graph:
        result += button(previous_graph_header_class,
                         f"Graph for {previous}",
                         f"Display graph for {previous}",
                         f"view-{viewid}-previous-graph")

    result += "</ul></div></nav>"

    # the contents of the various tabs

    result += '<div class="tab-content" markdown="0">\n'

    # plain
    result += f'''<div id="view-{viewid}-plain"
class="tab-pane fade {plain_body_class}" markdown="0">'''
    result += f'<pre>\n'
    result += implement_include(main, "codeview")
    result += f'</pre>\n'
    result += f'</div>'

    # graph
    if graph:
        result += f'''<div id="view-{viewid}-graph"
class="tab-pane fade {graph_body_class}">'''
        result += f'<img src="/assets/code/{graph}" style="max-width:100%;">'
        result += f'</div>'

    # diff
    if previous:
        result += f'''<div id="view-{viewid}-diff"
class="tab-pane fade {diff_body_class}" markdown="0">'''
        result += implement_codediff(f'diff-{viewid}',
                                     previous, main, lang=lang)
        result += f'</div>'

    # graph
    if previous_graph:
        result += f'''<div id="view-{viewid}-previous-graph"
class="tab-pane fade {previous_graph_body_class}">'''
        result += f'''<img src="/assets/code/{previous_graph}"
style="max-width:100%;">'''
        result += f'</div>'

    result += "</div><!-- pills targets-->"
    return result


@csrf_protect
def markdown_page(request, markdown_file, extra_metavars=None):
    """
    the view to render a URL that points at a markdown source
    e.g.
    if markdown_file is 'index' - or 'index.md', then we
     * look for the file markdown/index.md
     * extract any metavar in its header - they get passed to the template
     * and expand markdown to html - passed to the template
       as 'html_from_markdown'
    additional metavars can be passed along as well if needed
    """
    if extra_metavars is None:
        extra_metavars = {}
    logger.info(f"Rendering markdown page {markdown_file}")
    try:
        markdown_file = normalize(markdown_file)
        # fill in metavars: 'title', 'html_from_markdown',
        # and any other defined in header
        metavars, markdown = parse(markdown_file)
        # convert markdown
        html = markdown_module.markdown(
            markdown, extras=['markdown-in-html', 'toc', 
                              'header-ids', 'fenced-code-blocks'])
        toc = html.toc_html
        # handle our tags
        html = resolve_tags(html)
        # handle [TOC] if present
        if toc:
            html = html.replace('[TOC]', toc)
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
    except Exception as exc:                            # pylint: disable=w0703
        error_message = f"<h1>Oops - cannot render markdown file" \
                        f" {markdown_file}</h1>"
        if isinstance(exc, FileNotFoundError):
            # turned off following an advice from inria's security cell
            # error_message += str(exc)
            error_message += " file not found"
        else:
            stack = traceback.format_exc()
            logger.info(f"Storing stacktrace in previous_message - {stack}")
            error_message += "<pre>\n{}\n</pre>".format(stack)
        error_message = mark_safe(error_message)
        if settings.DEBUG:
            return HttpResponseNotFound(error_message)
        else:
            return markdown_page(request, 'oops',
                                 {'previous_message': error_message})
