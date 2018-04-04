/**
 * Performance with penalty
 */

var handler = new OpenmixApplication({

    providers: {
        'equinix': {
            cname: 'origin.20minutes.fr',
            // penalty (in percent) added to rtt score
            padding: 10
        },
        'edgecast': {
            cname: 'wac.6497.edgecastcdn.net',
            padding: 0
        },
        'level3': {
            cname:'cache.20minutes.fr.c.footprint.net',
            padding: 0
        }
    },

    // The TTL to be set when the application chooses a geo provider.
    default_ttl: 20,
    availability_threshold: 90

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
    this.do_init = function(config) {
        var i = aliases.length;

        while (i --) {
            config.requireProvider(aliases[i]);
        }
    };

    /**
     * @param {OpenmixRequest} request
     * @param {OpenmixResponse} response
     */
    this.handle_request = function(request, response) {
        var dataAvail = request.getProbe('avail'),
            dataRtt = request.getProbe('http_rtt'),
            i,
            key,
            allReasons,
            decisionProvider,
            decisionReason = "",
            candidates = dataRtt,
            candidateAliases = Object.keys(dataRtt);

        allReasons = {
            best_performing_provider: 'A',
            data_problem: 'B',
            all_providers_eliminated: 'C'
        };

        if (candidateAliases.length > 0){
            // Add penalties
            i = candidateAliases.length;
            while (i--){
                key = candidateAliases[i];
                if (settings.providers[key].padding !== undefined) {
                    candidates[key].http_rtt += settings.providers[key].padding / 100 * candidates[key].http_rtt;
                }
            }

            // Select the best performing provider that meets its minimum
            // availability score, if given
            candidates = joinObjects(dataRtt, dataAvail, 'avail');
            candidates = filterObject(candidates, filterAvailability);

            if (Object.keys(candidates).length > 0){
                decisionProvider = getLowest(candidates, 'http_rtt');
                decisionReason = allReasons.best_performing_provider;
            }
            else {
                decisionProvider = getHighest(dataAvail, 'avail');
                decisionReason = allReasons.all_providers_eliminated;
            }
        }

        if (decisionProvider === undefined) {
            decisionProvider = aliases[Math.floor(Math.random() * aliases.length)];
            decisionReason = allReasons.data_problem;
        }

        response.respond(decisionProvider, settings.providers[decisionProvider].cname);
        response.setTTL(settings.default_ttl);
        response.setReasonCode(decisionReason);
    };

    /**
     * @param {!Object} target
     * @param {Object} source
     * @param {string} property
     */
    function joinObjects(target, source, property) {
        var keys = Object.keys(target),
            i = keys.length,
            key;
        while (i --) {
            key = keys[i];
            if (source[key] !== undefined && source[key][property] !== undefined) {
                target[key][property] = source[key][property];
            }
            else {
                delete target[key];
            }
        }
        return target;
    }

    /**
     * @param candidate
     * @returns {boolean}
     */
    function filterAvailability(candidate) {
        return candidate.avail >= settings.availability_threshold;
    }

    /**
     * @param {!Object} object
     * @param {Function} filter
     */
    function filterObject(object, filter) {
        var keys = Object.keys(object),
            i = keys.length,
            key,
            candidate = {};
        while (i --) {
            key = keys[i];
            if (filter(object[key], key)) {
                candidate[key] = object[key];
            }
        }
        return candidate;
    }

    /**
     * @param {!Object} source
     * @param {string} property
     */
    function getLowest(source, property) {
        var keys = Object.keys(source),
            i = keys.length,
            key,
            candidate,
            min = Infinity,
            value;
        while (i --) {
            key = keys[i];
            value = source[key][property];
            if (value < min) {
                candidate = key;
                min = value;
            }
        }
        return candidate;
    }

    /**
     * @param {!Object} source
     * @param {string} property
     */
    function getHighest(source, property) {
        var keys = Object.keys(source),
            i = keys.length,
            key,
            candidate,
            max = -Infinity,
            value;

        while (i --) {
            key = keys[i];
            value = source[key][property];

            if (value > max) {
                candidate = key;
                max = value;
            }
        }

        return candidate;
    }

}
