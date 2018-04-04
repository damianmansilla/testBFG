/*jslint
    unparam:true
*/

var handler;

/** @constructor */
function OpenmixApplication() {
    'use strict';

    this.do_init = function(config) {
        config.requireProvider('anycast');
    };

    this.handle_request = function(request, response) {
        response.respond('anycast', 'a.prod.fastly.net');
        response.setTTL(20);
    };

}

handler = new OpenmixApplication();

function init(config) {
    'use strict';
    handler.do_init(config);
}

function onRequest(request, response) {
    'use strict';
    handler.handle_request(request, response);
}
