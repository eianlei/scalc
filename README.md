# scalc
**scalc** is a Web tool for interactive calculations needed for planning technical scuba dives.
It is currently work in progress and under active development.
The existing and planned calculation tools include:
- MOD calculation: working 
- gas blending: working, needs improvment
- dive planner: not yet available

# scalc at scalc.leiman.fi
There is a working sample of the tool running at: http://scalc.leiman.fi/

Note that the site leiman.fi does not have an SSL-certificate, so there is no HTTPS and therefore most browsers will give you warnings. 
But you can safely ignore the warnings. 

# technology
**scalc** is a plain vanilla HTML, CSS, Javascript and does not use any fancy JS frameworks (such as Angular, React, Vue, Svelte etc...).
The UI uses plain HTML elements.
Calculations are done by Javascript functions running on your browser. There is no back-end, nothing is calculated at the server end.

# Background
The Javascript used in calculations is refactored from following Python and C# projects that I have published previously:
- https://github.com/eianlei/pydplan/blob/master/doc/fillcalc2.md
- https://github.com/eianlei/FillCalcWin 
- https://github.com/eianlei/pydplan

The UI is a web (HTML5, CSS, JS) implementation of the respective GUIs done in Qt5 and WPF/.NET 4.8/XAML.
