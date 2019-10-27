`/etc/nginx/nginx.conf`:
```nginx
user root;
# ...
http {
	# ...

	include /root/keyboard-layout-editor/deploy/nginx.conf;
}
# ...
```

`/etc/nginx/sites-enabled/default`:
```
# ...
server {
	listen 6464 default_server;
	listen [::]:6464 default_server;
# ...
```

`cp kle.service /etc/systemd/system/`, replace `<absolute_path>` to absolute path to `keyboald-layout-editor` folder, replace `<client_id>`, `<client_secret>` to your Github OAuth id and secret.

```
./deploy/deploy
nginx -s reload
```