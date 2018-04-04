/*
 Choose the best provider by Throughput, if the top 2 are within $tieThreshold %, use Response time to break the tie
 */
var handler = new OpenmixApplication({
    /**
     * The list of available CNAMEs, keyed by alias.
     */
    providers: {
        'level3': {
            cname:'cache.videos.20minutes.fr.c.footprint.net'
        },
        'edgecast_large': {
            cname: 'wpc.6497.edgecastcdn.net'
        }
    },

    // The TTL to be set when the application chooses a geo provider.
    default_ttl: 20,
    availability_threshold: 90,
    tie_threshold: 0.95


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
            dataKbps = request.getProbe('http_kbps'),
            first,
            second,
            allReasons,
            decisionProvider,
            decisionReason = "",
            candidates = {},
            availCandidates = {},
            availCandidatesAliases,
            kbpsCandidates = {};

        allReasons = {
            best_performing_by_kbps: 'A',
            best_performing_by_rtt: 'B',
            data_problem: 'C',
            all_providers_eliminated: 'D'
        };


        availCandidates = filterObject(dataAvail, filterAvailability);
        availCandidatesAliases = Object.keys(availCandidates);
        //If none or just one are available, choose the least bad

        if (availCandidatesAliases.length <= 1) {
            decisionProvider = getHighest(dataAvail, 'avail', '');
            decisionReason = allReasons.all_providers_eliminated;
        }
        else {
            if (Object.keys(dataKbps).length > 0){
                kbpsCandidates = joinObjects(dataKbps,availCandidates, 'avail');
                if (Object.keys(kbpsCandidates).length > 1){
                    // See if the top 2 are a tie
                    first = getHighest(kbpsCandidates, 'http_kbps', '');
                    second = getHighest(kbpsCandidates, 'http_kbps', first);

                    if (kbpsCandidates[first].http_kbps * settings.tie_threshold < kbpsCandidates[second].http_kbps
                        && dataRtt[first] !== undefined && dataRtt[second] !== undefined
                        && dataRtt[second].http_rtt < dataRtt[first].http_rtt) {
                        // Tied and send fastest by kbps has lower rtt
                        decisionProvider = second;
                        decisionReason = allReasons.best_performing_by_rtt;
                    }
                    else {
                        // Best provider chosen by either kbps or rtt...
                        decisionProvider = first;
                        decisionReason = allReasons.best_performing_by_kbps;
                    }

                }
            }

            // We lack KBPS measurements so choose by RTT
            if (!decisionProvider && Object.keys(dataRtt).length > 0) {
                // Join rtt with available candidates
                candidates = joinObjects(dataRtt, availCandidates, 'avail');
                decisionProvider = getLowest(candidates, 'http_rtt');
                decisionReason = allReasons.best_performing_by_rtt;
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
     * @param {string} exclude
     */
    function getHighest(source, property, exclude) {
        var keys = Object.keys(source),
            i = keys.length,
            key,
            candidate,
            max = -Infinity,
            value;
        while (i --) {
            key = keys[i];
            if (key !== exclude) {
                value = source[key][property];
                if (value > max) {
                    candidate = key;
                    max = value;
                }
            }
        }
        return candidate;
    }

}
