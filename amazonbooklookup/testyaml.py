import webapp2
import yaml
import re
import logging

import xml.dom.minidom
from xml.etree.ElementTree import ElementTree
import xml2json
import json

import amazonproduct


def minidom_response_parser(fp):                                           
     #root = xml.dom.minidom.parse(fp)                                                       
     et = ElementTree()
     root = et.parse(fp)                                                       
     return root                                                            
def string_response_parser(fp):                                           
     linestring = fp.read()
     return linestring 

#def mylogg(*arg, **varg):
#    traceback.print_stack()
#
#import traceback
#logging.error = mylogg

class MainHandler(webapp2.RequestHandler):
    amazon_credentials=""
    def get(self):
        if not self.request.get('ean'):
            return
        
        id_type = 'EAN'
        ean = self.request.get('ean')
        if len(ean) <13:
            id_type = 'ISBN'
        
        with open("amazon.yml", "r") as config_file:
            amazon_credentials = yaml.load(config_file)

        amazon = amazonproduct.api.API(*[amazon_credentials.get(k) 
            for k in ("access_key","secret_key", "locale",  "associate_tag")], processor=string_response_parser)
        #node = amazon.item_search('Books', Publisher='Galileo Press')"
        #node = amazon.item_lookup('9781593271190',SearchIndex='Books',  IdType="EAN", ResponseGroup="Large")
        node = amazon.item_lookup(ean, SearchIndex='Books',  IdType=id_type, ResponseGroup="Small,Reviews,Images")
        self.response.headers.add_header('Content-Type',"application/json; charset=utf-8")
        self.response.headers.add_header('Connection',"close")

        js_string = xml2json.xml2json(node)

        # The xml tree will have the schema url in the tags, which we don't want
        js_string = re.sub(r'\{http.*?\}','',js_string)

        self.response.out.write(js_string)
        logging.info(type(self.response))
        logging.info(type(self.response.out))

app = webapp2.WSGIApplication([('/', MainHandler)],
                              debug=True)
