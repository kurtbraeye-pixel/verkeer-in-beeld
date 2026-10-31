# Lokale testserver die de browser verbiedt bestanden te onthouden (Cache-Control: no-store),
# zodat je na een wijziging altijd de nieuwste HTML, CSS en JS ziet.
import http.server, functools, os

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
http.server.ThreadingHTTPServer(('127.0.0.1', 8124), functools.partial(NoCache, directory=root)).serve_forever()
