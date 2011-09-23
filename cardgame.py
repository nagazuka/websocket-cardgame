import tornado.ioloop
import tornado.web

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

class FormHandler(tornado.web.RequestHandler):
    def get(self):
        self.write('<html><body><form action="/form" method="post">'
                   '<input type="text" name="message">'
                   '<input type="submit" value="Submit">'
                   '</form></body></html>')

    def post(self):
        self.set_header("Content-Type", "text/plain")
        self.write("You wrote " + self.get_argument("message"))

application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/form", FormHandler),
    (r"/styles/(.*)", tornado.web.StaticFileHandler, {"path": "styles"}),
    (r"/js/(.*)", tornado.web.StaticFileHandler, {"path": "js"}),
    (r"/images/(.*)", tornado.web.StaticFileHandler, {"path": "images"}),
], debug=True)

if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
