# AnNam Spa Static Theme

Static recreation of the AnNam Spa homepage, organized as reusable HTML components.

## Structure

- `index.html`: page shell and component declarations
- `components/`: independent HTML fragments
- `assets/js/component-loader.js`: loads the fragments into the page
- `style.css`: shared styles
- `assets/`: local images, logos, icons and fonts

## Run locally

Component files are loaded with `fetch()`, so the site must run through a local web server:

```sh
python -m http.server 8080
```

Then open `http://localhost:8080/`.
