var handler = new OpenmixApplication({
    generator_app_prefix: '2-01-2a40-0002',
    domains:  {
        'default': 'cloudscaler.org',
        'china': 'cdxcn.cn',
    },
});

/** @constructor */
function OpenmixApplication(settings) {
    'use strict';

    this.doInit = function(config) {
        config.requireProvider('anycast');
    };

    /**
     * @param { { hostname_prefix: string } } request
     */
    this.handleRequest = function(request, response) {
        var timestamp = new Date();

        // decide if we should use the china domain or not
        var worker_location = request.worker_id.substr(request.worker_id.length - 8);
        var worker_network = worker_location.substring(0,4);
        var domain = settings.domains['default'];
        if (worker_network === 'c.cn') {
            domain = settings.domains['china'];
        }

        var parts = request.hostname_prefix.split('-');
        if (2 === parts.length) {
            // Second time through
            // var elapsed = timestamp.valueOf() - parseInt(parts[1], 10);
            // elapsed = Math.max(0, elapsed);
            // response.setReasonCode(elapsed.toString());
            response.respond('anycast', 'global.prod.fastly.net');
        } else {
            // First time through (probably)
            response.respond('anycast', 'start-' + timestamp.valueOf() + '.' + settings.generator_app_prefix + '.' + 'cdx' + '.' + domain);
        }
        response.setTTL(20);
    };

}

function init(config) {
    'use strict';
    handler.doInit(config);
}

function onRequest(request, response) {
    'use strict';
    handler.handleRequest(request, response);
}
