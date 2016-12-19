# Create your views here.

import asyncio
import json
import time

from django.views.generic import View

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect

from r2lab.settings import logger
from omf.omfrestview import OmfRestView

from r2lab.isotime import expiration_date

# Create your views here.
class SlicesProxy(OmfRestView):

    @method_decorator(csrf_protect)
    def post(self, request, verb):
        auth_error = self.not_authenticated_error(request)
        if auth_error:
            return auth_error
        try:
            record = self.decode_body_as_json(request)
            if verb == 'get':
                return self.get_slices(record)
            if verb == 'renew':
                return self.renew_slice(record)
            else:
                return self.http_response_from_struct(
                    {'error' : "Unknown verb {}".format(verb)})
        except Exception as e:
            return self.http_response_from_struct(
                { 'error' : "Failure when running verb {}".format(verb),
                  'message' : e})


    def get_slices(self, record):
        """
        retrieve account objects
        if 'names' is provided in the input record, it should contain a
        list of slicenames (hrns) and only these will be probed then
        otherwise all slices are returned
        """
        error = self.check_record(record, (), ('names', ))
        if error:
            return self.http_response_from_struct(error)
        self.init_omf_sfa_proxy()
        ######## if names are specified
        if 'names' in record:
            # issue all requests in parallel
            jobs = [
                self.co_get_slice(slicename) for slicename in record['names']
            ]
            # we already have a list
            post_result_s = self.loop.run_until_complete(asyncio.gather(*jobs, loop=self.loop))
            responses = [ self.rain_check(post_result, "get slice", error_as_http=False)
                          for post_result in post_result_s ]
            responses_ok = [ result for result, error in responses if not error ]
            responses_ko = [ error for result, error in responses if error ]
            slices = [ response['resource_response']['resource']
                       for response in responses_ok ]
            for response_ko in responses_ko:
                logger.warning("when probing for slices : ignoring response {}"
                               .format(response_ko))
        ######## retrieve all slices in one shot
        else:
            post_result = self.loop.run_until_complete(self.co_get_slice())
            response, error = self.rain_check(post_result, "get slices")
            if error:
                return error
            slices = response['resource_response']['resources']
            slices = [ slice for slice in slices
                       if slice['name'] not in ('__default__', ) ]
            # temporary - should be handled in the UI
            slices.sort(key=lambda r: r['valid_until'])

        return self.http_response_from_struct(slices)

    @asyncio.coroutine
    def co_get_slice(self, slicename=None):
        url = "accounts" if slicename is None else "account?name={}".format(slicename)
        js = yield from self.omf_sfa_proxy.REST_as_json(url, "GET", None)
        return js


    def renew_slice(self, record):
        """
        renew a slice

        * mandatory argument is 'name' that should hold a valid hrn
        * optional argument is 'valid_until' that should then in the
        * about record['closed_at'] = '' It's not enought give a future date.
                                         The slice is booked only when this date is empty
                                         This is the reason of closed_at is '' (empty)
        omf-sfa timestamp format
          if not provided the slice is renewed until 2 months from now
        """
        error = self.check_record(record,
                                  ('name',), ('valid_until',))
        if error:
            return self.http_response_from_struct(error)
        if 'valid_until' not in record:
            day = 24*3600
            # 2 months is 61 days
            record['valid_until'] = expiration_date(61*day)
            record['closed_at'] = ''

        self.init_omf_sfa_proxy()
        post_result = self.loop.run_until_complete(self.co_update_slice(record))
        response, error = self.rain_check(post_result, "renew slice")
        if error:
            return error
        slice = response['resource_response']['resource']
        return self.http_response_from_struct(slice)

    @asyncio.coroutine
    def co_update_slice(self, record):
        slice_request = record
        logger.info("-> omf_sfa PUT request {}".format(slice_request))
        result = yield from self.omf_sfa_proxy.REST_as_json("accounts", "PUT", slice_request)
        logger.info("omf_sfa PUT -> {}".format(result))
        return result