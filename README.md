<p align="center">
    <a href="https://github.com/jakedeichert/rovr">
        <img alt="rovr logo" src="https://raw.githubusercontent.com/jakedeichert/rovr-website/master/assets/images/logos/rovr-dark-small.png" width="400">
    </a>
</p>

<p align="center">
    <strong>A fast and flexible React static site generator</strong>
</p>

---

**rovr** is a special static site generator that allows you to mix React, html, and markdown when writing pages.

Essentially, rovr takes a source directory and outputs to a destination directory. All html and markdown files are parsed for React components and then rendered to static html files.

Basically, React is the templating engine here. All logic is done within your React component files.


## Installation

rovr is on [npm](https://www.npmjs.com/package/rovr) and comes with both a CLI and API

~~~bash
npm install rovr -g
~~~

## Usage

rovr expects a few things from your source directory...

**_components/** - This directory contains your js(x) React component files. All of these files are run through Babel, so feel free to write in ES2015 syntax.

**_layouts/** - Familiar with Jekyll? This directory contains html files used for layouts that your pages can use.

**_config.yml** - Configure rovr to your delight. Supports both yaml and json.

**_metadata.yml** - Specify metadata that you can use within all of your html and markdown pages. Similar to Jekyll's `site` data. Supports both yaml and json.




### Directory Structure

Here's the basic structure for a rovr website:

~~~
website
├── _BUILD --------------- the default destination that rovr builds to
├── _components ---------- js(x) React component files
│   ├── buttons
│   │   ├── PrimaryButton.jsx
│   │   └── SecondaryButton.js
│   ├── Footer.js
│   ├── Header.jsx
│   └── Nav.js
├── _layouts ------------- html layout files for pages
│   ├── default.html
│   └── post.html
├── _my-stuff ------------ rovr ignores files/dirs that start with an underscore
│   └── secret-journal.md
├── posts ---------------- you like to blog right?
│   ├── post-1.md
│   └── post-2.md
├── _config.yml ---------- configure rovr
├── _metadata.yml -------- site metadata
└── index.html ----------- everyone has one of these
~~~


### Quick Example

Here's a really brief example of a rovr website using some React components, a layout and a page.

**_components/PrimaryButton.jsx**
~~~jsx
class PrimaryButton extends React.Component {
    render() {
        return <a className="btn-primary" href={ this.props.href }>
            { this.props.text}
        </a>;
    }
}
~~~


**_components/Nav.js**
~~~jsx
class Nav extends React.Component {
    render() {
        return <nav>
            <a href="/">Home</a>
            <a href="/docs">Docs</a>
            <a href="/api">API</a>
            <PrimaryButton text="GitHub" href="https://github.com/rovrjs/rovr"/>
        </nav>;
    }
}
~~~


**_layouts/default.html**
~~~html
<!DOCTYPE html>
<html>
<head>
    <title>
        {{ content.title }} - {{ site.title }} <!-- Access page and site metadata -->
    </title>
</head>
<body>
    <Nav/> <!-- Use your React components anywhere -->
    {{ content }} <!-- Inserts the page's content here -->
</body>
</html>
~~~


**index.md**
```md
---
layout: "default"
title: "Home"
---

# home

This is **rovr**.

Checkout rovr on npm...

<PrimaryButton text="rovr on npm" href="https://www.npmjs.com/package/rovr"/>
```



### Real Example

Checkout the source for the rovr website.

* [jakedeichert/rovr-website](https://github.com/jakedeichert/rovr-website)


### Plugins

You can add plugins to the rovr generation pipeline. A plugin is a class with one or more hook functions:

**pre(files, rovr, doneCallback)**

This hooks into the pre-render pipeline. These plugins are ran before rovr-renderer which converts markdown to html and renders react components.

**post(files, rovr, doneCallback)**

This hooks into the post-render pipeline. These plugins are ran after the rovr-renderer is finished but before the files are written to the destination directory.


## CLI

The CLI isn't much at all. Simply build your website by running `rovr` in a directory. By default, rovr outputs to a destination directory named `_BUILD`

The CLI will attempt to load the `_config.yml` and `_metadata.yml` files if they exist.

~~~bash
cd website
rovr
~~~


## License

Copyright (c) 2015, [Jake Deichert](https://github.com/jakedeichert)

[MIT License](https://github.com/jakedeichert/rovr/blob/master/LICENSE)
