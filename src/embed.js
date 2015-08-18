var d3 = require('d3'),
    vg = require('vega'),
    parameter = require('./param'),
    post = require('./post');

var config = {
  // URL for loading specs into editor
  editor_url: 'http://vega.github.io/vega-editor/',

  // HTML to inject within view source head element
  source_header: '',

  // HTML to inject before view source closing body tag
  source_footer: ''
};

// Embed a Vega visualization component in a web page.
// el: DOM element in which to place component (DOM node or CSS selector)
// opt: Embedding specification (parsed JSON or string)
// callback: invoked with the generated Vega View instance
function embed(el, opt, callback) {
  var source, spec, params = [];

  if (opt.source) {
    source = opt.source;
    spec = JSON.parse(source);
  } else if (opt.spec) {
    spec = opt.spec;
    source = JSON.stringify(spec, null, 2);
  } else if (opt.url) {
    vg.util.load({url: opt.url}, function(err, data) {
      if (err) {
        console.error(err);
      } else if (!data) {
        console.error('No data found at ' + opt.url);
      } else {
        // load code, extends options, and restart
        embed(el, vg.util.extend({source: data}, opt), callback);
      }
    });
    return;
  }

  // ensure container div has class 'vega-embed'
  var div = d3.select(el)
    .attr('class', 'vega-embed');

  // handle parameters
  if (opt.params) {
    var pdiv = div.append('div')
      .attr('class', 'vega-params');
    opt.params.forEach(function(p) {
      params = params.concat(parameter(pdiv, p, spec));
    });
  }

  vg.parse.spec(spec, function(chart) {
    var view = chart({el: el});

    // add child div to house action links
    var ctrl = div.append('div')
      .attr('class', 'vega-actions');

    // add 'View Source' action
    ctrl.append('a')
      .text('View Source')
      .attr('href', '#')
      .on('click', function() {
        viewSource(source);
        d3.event.preventDefault();
      });

    // add 'Open in Vega Editor' action
    ctrl.append('a')
      .text('Open in Vega Editor')
      .attr('href', '#')
      .on('click', function() {
        post(window, embed.config.editor_url, {spec: source});
        d3.event.preventDefault();
      });

    // bind all parameter elements
    params.forEach(function(el) { el.__vega__ = view; });

    // initialize and return visualization
    view.update();
    if (callback) callback(view);
  });
}

function viewSource(source) {
  var header = '<html><head>' + config.source_header + '</head>' + '<body><pre><code class="json">';
  var footer = '</code></pre>' + config.source_footer + '</body></html>';
  var win = window.open('');
  win.document.write(header + source + footer);
  win.document.title = 'Vega JSON Source';
}

// make config externally visible
embed.config = config;

module.exports = embed;
