
# HIT226 Assignment 1A

Copyright © 2016 Samuel Walladge

## Urls

The live site for my submission for assignment 1A can be found at https://uni.swalladge.id.au/hit226/assignment1a/.

The full source is managed with git and available online at https://bitbucket.org/swalladge/hit226-a1/src.

## Notes

- The W3C CSS validator throws some errors (`auto is not a flex-flow value : 0 1 auto`) - this can be ignored, since those values in my CSS are valid (source: http://www.w3.org/TR/css-flexbox-1/#valdef-flex-basis-auto).
- Please don't use Internet Explorer (any versions) to view the website, as it doesn't support flexible boxes layouts properly at all (source: http://caniuse.com/#feat=flexbox).

## Technical details

This is a static site generated using [Jekyll](http://jekyllrb.com/).

It uses [Liquid](http://liquidmarkup.org/) templates for templating, [Sass](http://sass-lang.com/) for pre-processing css, and [Bower](http://bower.io/) for managing external libraries (like stylesheets, frameworks, javascript libraries).

- to build the site, run `jekyll build` from the root directory
- the actual static site, once generated, resides in `_site/` (everything under this directory can be copied directly into the web hosting root directory or path from root as specified in `_config.yml`)

