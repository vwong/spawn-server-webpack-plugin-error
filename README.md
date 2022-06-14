# spawn-server-webpack-plugin-error
Reproduction for `spawn-server-webpack-plugin` issue

* Run npm run dev to start, open http://localhost:15015
* Notice the background color
* Update src/pages/home/components/hero/style.scss to change the background colour
* See that the browser is trying to reload but gets stuck
* Try opening using a different browser, and notice that gets stuck too
* Try changing a *.ts, or *.marko file, the server + browser reloads fine.
* Downgrade to spawn-server-webpack-plugin@6.2.0, everything works fine, including changing *.scss files.
