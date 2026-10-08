# Dive Planner Help

This document contains detailed usage instructions for the dive planner.
*Please read carfully and thoroughly before using this calculator for the first time.*

## Disclaimer

This tool is for educational use only. **Do not use for planning real dives.**
Accuracy of the calculated plans cannot be guaranteed and may not be safe to follow. 

## Overview

The planner calculates a [Bühlmann ZHL-16C decompression schedule](https://en.wikipedia.org/wiki/B%C3%BChlmann_decompression_algorithm) with configurable bottom depth, bottom time, gradient factors, tanks, and gases. The planner shows a dive profile plan graph and textual output. The plan output changes automatically when any input parameter is changed. The re-calculation is usually instantaneous.

The Bühlmann ZHL-16C decompression model is used in most modern dive computers to calculate NDL (Non Decompression Limit) for non-technical dives, and for technical decompression dives the ascent ceiling depths and deco stop durations in real time.

## TL;DR; Quick start

1. Set bottom depth and time.
2. Choose gradient factors or pick a preset.
3. Configure bottom and deco tanks.
4. Review the profile chart and text output.

## Units
Only metric units supported: meters, bars, liters. Times in minutes.

## Dive bottom time and depth, Gradient Factors
This tool supports calculation for a simple dive profile with a fixed descent time 10 m/min to a configurable bottom depth for a configurable bottom time.  

Gradient Factors low and high can be configured. Common GFs can be selected from a drop down menu.

## Specify your tanks and gases for the dive
Use the form table to configure what gases to use for the dive.
### bottom gas
- The top row is used for selecting your bottom gas. There is a dropdown menu to quickly pick from a list of most common or "standard" gases. 
- You can use the O2% and He% columns to configure any type of gas you want.
- You can also configure the starting pressure in bar, tank size in liters and your SAC (Surface Air Consumption) in liters/minute 
- Start bar configures the starting pressure of the tank. That, the tank size and SAC will be used to calculate gas consumption.

### deco gases
2nd and 3rd rows configure up to 2 deco tanks for ascent. 
- You can click them on or off. 
- For deco tanks configure the depth at which it is switched.
- Effect of lost deco tank/gas can simply be simulated by clicking it off.

## Dive profile graph
- The graph shows the planned dive profile with calculated deco stops as filled blue.
- the green fill at surface shows the calculated deco ceiling, which is the depth you must stay below at any given time 
- the orange line shows tank pressure with tank switches, the starting and ending tank pressures in red text

- The graph can be resized from bottom right corner.
- Moving mouse over will show depth and run time at mouse position.

## Deco planner results
- Plain text format deco plan
- Gas usage calculation
- list of deco stops
- the text box can be resized from bottom right corner

## Table button
Table button shows in table form the detailed calculation states of the Bühlmann algorithm for diagnostical and educational purposes.

## Browser debug console
Very detailed logging from browser console can be enabled from

**`web/scalc-vue/src/lib/planner/calculatePlan.js`**
```
const DEBUG = true;
```