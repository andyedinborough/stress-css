CSS Stress Test
---------------

This project is a bookmarklet for stress testing the CSS on any given webpage.  
It indexes all the elements and their classes, and then--class by class--it 
removes one, and times how long it takes to scroll the page.  Classes that 
save a considerable amount of time when removed indicate problem areas.

To install the bookmarklet, drag this link to your favorites: [CSS Stress Test][bookmarklet].

[bookmarklet]: javascript:(function(d){var s=d.createElement('script');s.src='https://github.com/andyedinborough/stress-css/raw/master/stressTest.js';d.getElementsByTagName('script')[0].insertBefore(s);var doit=function(){if(window.stressTest){stressTest.bookmarklet();}else{setTimeout(doit,100);}};doit();})(document);