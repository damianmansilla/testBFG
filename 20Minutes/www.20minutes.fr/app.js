/**
 * Performance with penalty
 */

var handler = new OpenmixApplication({

    providers: {
        'akamai': {
            cname: 'www.20minutes.fr.edgesuite.net',
            weight: 0
        },
        'fastly': {
            cname: 'www.20minutes.fr.a.prod.fastly.net',
            weight: 0
        },
        'equinix': {
            cname: 'origin.20minutes.fr',
            weight: 100
        }
    },

    // The TTL to be set when the application chooses a geo provider.
    default_ttl: 20

});

function init(config) {
    'use strict';
    handler.do_init(config);
}

function onRequest(request, response) {
    'use strict';
    handler.handle_request(request, response);
}

/** @constructor */
function OpenmixApplication(settings) {
    'use strict';

    var aliases = settings.providers === undefined ? [] : Object.keys(settings.providers);

    /**
     * @param {OpenmixConfiguration} config
     */
    this.do_init = function (config) {
        var i = aliases.length;

        while (i--) {
            config.requireProvider(aliases[i]);
        }
    };

    /**
     * @param {OpenmixRequest} request
     * @param {OpenmixResponse} response
     */
    this.handle_request = function (request, response) {
        var i,
            key,
            allReasons,
            decisionProvider,
            decisionReason = "",
            totalWeights,
            random,
            mark = 0;

        allReasons = {
            successfully_routed: 'A',
            insufficient_data: 'B'
        };

        totalWeights = sum(settings.providers, 'weight');
        random = rand(0, totalWeights -1);

        i = aliases.length;
        while (i-- && random >= mark) {
            key = aliases[i];
            mark += settings.providers[key].weight;
            if (random < mark){
                decisionProvider = key;
                decisionReason = allReasons.successfully_routed;
            }
        }
        if (decisionProvider === undefined) {
            decisionProvider = aliases[Math.floor(Math.random() * aliases.length)];
            decisionReason = allReasons.insufficient_data;
        }

        response.respond(decisionProvider, settings.providers[decisionProvider].cname);
        response.setTTL(settings.default_ttl);
        response.setReasonCode(decisionReason);
    };

    /**
     * @param {!Object} source
     * @param {string} property
     */
    function sum(source, property) {
        var keys = Object.keys(source),
            i = keys.length,
            key,
            weights = 0;
        while (i--) {
            key = keys[i];
            weights += source[key][property];
        }
        return weights;
    }

    /**
     * @param {number} min
     * @param {number} max
     */
    function rand(min, max) {
        return min === max ? min : Math.floor(Math.random() * (max - min)) + min;
    }

}