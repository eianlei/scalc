# scalc
**scalc** is a Web tool for interactive calculations needed for planning technical scuba dives.

[You can open the application here at GitHub pages by clicking this line](https://eianlei.github.io/scalc/index.html)

![mainwin-shorturl](https://github.com/eianlei/scalc/blob/master/scalc-planner.jpg?raw=true)


SCALC is currently work in progress and under active development.
The existing and planned calculation tools include:
- MOD calculation: working 
- gas blending: working, needs improvement
- dive planner: simple prototype, has many bugs and issues

# scalc at scalc.ianleiman.com
There is a working sample of the tool running at: https://scalc.ianleiman.com/

This sample may not be as up to date as the github.io instance that syncs directly from this repo: https://eianlei.github.io/scalc/index.html

# Installation
This is a web application so it needs to be served by a web server to a web browser. You can either install it to a "real" web server (such Apache, nginx) or use some local development solution such as VS Code Live Server extension.

It is possible to make this app run on electron so it can run like a normal desktop application. 
## web server
Just copy all the files in source folder to a web site server root. 
Or git clone this repo to the server.
The web server will serve index.html, which will call out all the modules. 
Usually a web browser will cache the entire application as it so small. 

### example how to clone the app on linux server and make apache virtual server
Assuming you have a standard linux server and apache is installed and running, and you use certbot for SSL.
```shell
ssh yoursever
cd /var/www
sudo mkdir scalc
sudo chown www-data:www-data scalc
sudo git clone https://github.com/eianlei/scalc.git
cd scalc
ls -l
# check that you have all you need
cd /etc/apache2/sites-available
nano scalc.yourdomain.conf
# edit the virtual host file, save and exit
# see example below
sudo a2ensite scalc.yourdomain.conf
sudo systemctl restart apache2
# http://scalc.yourdomain
# now get SSL cert using certbot
sudo certbot --apache
# https://scalc.yourdomain
```
### example virtual host file 
scalc.yourdomain.conf
```
UseCanonicalName On
<VirtualHost *:80>
        ServerAdmin you@yourdomain
        ServerName scalc.yourdomain
        DocumentRoot /var/www/scalc
        <Directory /var/www/scalc/>
            Options Indexes FollowSymLinks MultiViews
            AllowOverride All
            Require all granted
        </Directory>
        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

## VS code & Live Server
If you have Visual Studio Code installed, then it is really easy to run any web app using the Live Server extension.

In Visual Studio Code clone this repository.
Install "Live Server" extension. Now you can launch the app from editor to your browser using a local server with live reload.

## use python built-in development server
If you have git and python3 installed, you can clone this application and use python built-in web server.
To git clone and start a webserver using Python run the commands below:
```
cd some_directory
git clone https://github.com/eianlei/scalc.git
cd scalc
python3 -m http.server
```
That will open a webserver on port 8000. You can then open your browser at http://127.0.0.1:8000/.

After the app has loaded on your browser you can actually kill the web server (Ctrl-C) beacause it is now running on your browser and no longer needs a server.

# Technology
**scalc** is made from plain vanilla HTML, CSS, Javascript and does not use any fancy JS frameworks (such as Angular, React, Vue, Svelte etc...).
The UI uses plain HTML5 elements and canvas.
Calculations are done by pure and simple Javascript functions running on your browser. There is no back-end, nothing is calculated at the server end.
## dependencies
jQuery

# Background
The Javascript used in calculations is refactored (manually transpiled) from following Python and C# projects that I have published previously:
- https://github.com/eianlei/pydplan 
- https://github.com/eianlei/FillCalcWin 
 

The UI is a web (HTML5, CSS, JS) implementation of the respective GUIs done previously in Qt5 or WPF/.NET 4.8/XAML.

# Target users
The application is intended for certified technical divers and [Trimix](https://en.wikipedia.org/wiki/Trimix_(breathing_gas)) gas blenders, who [blend gases](https://en.wikipedia.org/wiki/Gas_blending_for_scuba_diving) and make plans for [technical scuba diving](https://en.wikipedia.org/wiki/Technical_diving).

It is assumed that anyone daring to use this application knows what they are doing.

# Disclaimers
Use this application at your own risk, the author provides no guarantees about the correctness of the application, and assumes no liability for the use of it for any purpose!

* In no event should you consider blending breathing gases without proper training!
* In no event should you consider scuba diving with mixed gases without proper training!
* Ignoring these warnings can cause your **death** or **serious and permanent injuries**!

# Development history & roadmap
- 2021-11-03 published to github a quickly hacked up demo, that needs lot of TLC
- 2021-11-08 added the dive planner prototype
- 2021-11-12 most of essential functionality in place
- 2021-11-21 big cleaning up & refactoring of very messy code in planner 
- 2021-11-23 implemented Van Der Waals gas law calculation to blender

## todo short term:
- some cleanup, proper structuring and commentting to the sources
- make UI mobile friendly (CSS)
- do a proper favicon
- add user documentation
- to Blender: bring up all the same functionality that exists in [FillCalcWin](https://github.com/eianlei/FillCalcWin)
  - new feature: use gas temperatures in calculations 
- Planner implementation, 
  - Bühlmann: have manually transpiled Python code to Javascript from [pydplan](https://github.com/eianlei/pydplan), 
  but the code still need some fine tuning
  - improvements on graphical web UI

## long term plans:
- desktop version will run on [electron](https://www.electronjs.org/) and include Windows installer
- Android and iOS mobile versions using [Cordova](https://cordova.apache.org/)

# License
Copyright (C) 2021 Ian Leiman

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, version 3 of the License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
    
See https://www.gnu.org/licenses/gpl-3.0.html</a>.

  
