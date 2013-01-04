#!/bin/sh

sudo rsync -rv --delete --exclude=.git --exclude=*.pyc --exclude=nohup.out --exclude=*.log /home/tornado/development/tornado-websocket/ /var/www/vhosts/nagazuka.nl/subdomains/troefcall/websocket-cardgame/alpha
sudo sed 's/TroefCall Online/TroefCall Online Alpha/g' /var/www/vhosts/nagazuka.nl/subdomains/troefcall/websocket-cardgame/alpha/index.html >index_alpha.html
sudo mv index_alpha.html /var/www/vhosts/nagazuka.nl/subdomains/troefcall/alpha/index.html 
touch server/server.py
