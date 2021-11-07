# scalc
**scalc** is a Web tool for interactive calculations needed for planning technical scuba dives.
![mainwin-shorturl](https://github.com/eianlei/scalc/blob/master/scalc-blender.jpg?raw=true)

It is currently work in progress and under active development.
The existing and planned calculation tools include:
- MOD calculation: working 
- gas blending: working, needs improvement
- dive planner: not yet available, coming soon

# scalc at scalc.leiman.fi
There is a working sample of the tool running at: http://scalc.leiman.fi/

Note that the site leiman.fi does not have an SSL-certificate, so there is no HTTPS and therefore most browsers will give you warnings. 
But you can safely ignore the warnings. 

# Technology
**scalc** is a plain vanilla HTML, CSS, Javascript and does not use any fancy JS frameworks (such as Angular, React, Vue, Svelte etc...).
The UI uses plain HTML5 elements.
Calculations are done by pure and simple Javascript functions running on your browser. There is no back-end, nothing is calculated at the server end.

# Background
The Javascript used in calculations is refactored (manually transpiled) from following Python and C# projects that I have published previously:
- https://github.com/eianlei/pydplan/blob/master/doc/fillcalc2.md
- https://github.com/eianlei/FillCalcWin 
- https://github.com/eianlei/pydplan

The UI is a web (HTML5, CSS, JS) implementation of the respective GUIs done in Qt5 and WPF/.NET 4.8/XAML.

# Target users
The application is intended for certified technical divers and [Trimix](https://en.wikipedia.org/wiki/Trimix_(breathing_gas)) gas blenders, who [blend gases](https://en.wikipedia.org/wiki/Gas_blending_for_scuba_diving) and make plans for [technical scuba diving](https://en.wikipedia.org/wiki/Technical_diving).

It is assumed that anyone daring to use this application knows what they are doing.

# Disclaimers
Use this application at your own risk, the author provides no guarantees about the correctness of the application, and assumes no liability for the use of it for any purpose!

* In no event should you consider blending breathing gases without proper training!
* In no event should you consider scuba diving with mixed gases without proper training!
* Ignoring these warnings can cause your **death** or **serious and permanent injuries**!

# Development roadmap
- 2021-11-03 published to github a quickly hacked up demo, that needs lot of TLC

todo short term:
- some cleanup, proper structuring and commentting to the sources
- make UI mobile friendly (CSS)
- do a proper favicon
- add user documentation
- to Blender bring up all the same functionality that exists in [FillCalcWin](https://github.com/eianlei/FillCalcWin)
  - std gas dropdown
  - cost calculation
  - VanDerWaals
- Planner implementation, 
  - Bühlmann: needs transpiling Python code to Javascript from [pydplan](https://github.com/eianlei/pydplan)
  - need to develop a new web UI

long term plans:
- publish a desktop version that will run on electron and include Windows installer


  
