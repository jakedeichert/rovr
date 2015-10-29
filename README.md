<a href="https://github.com/rovrjs/rovr">
    <img alt="rovr logo" src="https://raw.githubusercontent.com/rovrjs/rovrjs.github.io/master-src/assets/images/logos/rovr-dark.png">
</a>

> A fast and flexible React static site generator

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
website/
    _BUILD/ ----------------------------- the default destination directory that rovr builds to

    _components/ ------------------------ js(x) React component files
        buttons/
            PrimaryButton.jsx
            SecondaryButton.js
        Footer.js
        Header.jsx
        Nav.js

    _layouts/ --------------------------- html layout files for pages
        default.html
        post.html

    _my-stuff/ -------------------------- rovr ignores files/dirs that start with an underscore
        secret-journal.md

    posts/ ------------------------------ you like to blog right?
        post-1.md
        post-2.md

    _config.yml ------------------------ configure rovr

    _metadata.yml ---------------------- site metadata

    index.html ------------------------- everyone has one of these
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

* [rovrjs/rovrjs.github.io](https://github.com/rovrjs/rovrjs.github.io)
* [rovrjs.github.io](https://rovrjs.github.io)




## CLI

The CLI is a little uninspiring right now... but this is the next big task on my todo list.

Simply build your website by running `rovr` in a directory. By default, rovr outputs to a destination directory named `_BUILD`

The CLI will attempt to load the `_config.yml` and `_metadata.yml` files if they exist.

~~~bash
cd website
rovr
~~~



## More Details

Once I complete the [rovr website](https://rovrjs.github.io), it will become the home for all documentation and examples.

More details coming soon for:

* API
* config options
* plugins



## License

Copyright (c) 2015, [Jake Deichert](https://github.com/jakedeichert)

[MIT License](https://github.com/rovrjs/rovr/blob/master/LICENSE)

