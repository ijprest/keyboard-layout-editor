#!/usr/bin/python3 -u

import http.server
import socketserver
from http import HTTPStatus
import requests
import argparse
import time


client_id = "Client ID"
client_secret = "Client Secret"


class Handler(http.server.SimpleHTTPRequestHandler):
	def process_authorization(self):
		size = len("/authorization/")
		code = self.path[size:]
		r = requests.post(
			url="https://github.com/login/oauth/access_token",
			params=[
				("client_id", client_id),
				("client_secret", client_secret),
				("code", code),
				("redirect_uri", "https://kle.klava.org/oauth.html")
			],
			headers={"Accept": "application/json"}
		)

		self.send_response(HTTPStatus.OK)
		self.send_header("Access-Control-Allow-Origin", "*")
		self.send_header("Access-Control-Allow-Methods", "GET")
		self.send_header("Access-Control-Allow-Headers", "Accept")
		self.end_headers()
		self.wfile.write(r.text.encode('utf-8'))

	def do_GET(self):
		if self.path.startswith("/authorization/"):
			self.process_authorization()
		else:
			self.send_response(404)


def parse_args():
	parser = argparse.ArgumentParser()
	parser.add_argument('--client-id', type=str)
	parser.add_argument('--client-secret', type=str)
	parser.add_argument('--port', default=81, type=int)
	return parser.parse_args()


def main():
	global client_id
	global client_secret
	args = parse_args()
	client_id = args.client_id
	client_secret = args.client_secret

	for i in range(100):
		try:
			httpd = socketserver.TCPServer(('', args.port), Handler)
			httpd.serve_forever()
		except OSError as e:
			if e.errno != 98:
				break
			print("Waiting a {} second for port {}".format(i, args.port))
			time.sleep(1)
		except KeyboardInterrupt:
			httpd.shutdown()
			print("\nSucessfully shutdown server")
			raise KeyboardInterrupt


if __name__ == "__main__":
	main()
