var handler = new OpenmixApplication({
    /**
     * The list of available CNAMEs, keyed by alias.
     * padding and surpenal are in percent. 10 = 10% slower (score * 1.1)
     * penal means padding come from Fusion
     * first one is fallback
     */
    providers: {
        'edgecast': { 'cname': 'wac.6497.edgecastcdn.net', 'padding': 0, 'penal': false },
        'ovh-1': { 'cname': '5.135.137.172', 'padding': 0, 'penal': true, 'surpenal': -15 },
        'online-1': { 'cname': '163.172.15.235', 'padding': 0, 'penal': true, 'surpenal': -15 }
    },
    asn_override: {
        34006: {
            // The fallback provider is in case the 'provider' is not available
            'provider': 'online-1',
            'fallback': 'ovh-1'
        }
    },
    availability_threshold: 90,
    max_delta: 70,
    security_threshold: 100,
    default_ttl: 20,
    random_threshold: 5
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

    var aliases = settings.providers === undefined ? [] : Object.keys(settings.providers),
        allReasons = { best_performing: 'A', data_problem: 'B', all_providers_eliminated: 'C', asn_override: 'D', asn_override_fallback: 'E' };

    /**
     * @param {OpenmixConfiguration} config
     */
    this.do_init = function(config) {
        // Register the providers that will be selected from
        aliases.forEach( function(entry) { config.requireProvider(entry); });
    };

    /**
     * @param {OpenmixRequest} request
     * @param {OpenmixResponse} response
     */
    this.handle_request = function(request, response) {
        var dataFusion = request.getData('fusion'),
            dataAvail = request.getProbe('avail'),
            dataRtt = request.getProbe('http_rtt'),
            //country = request.country,
            decisionProvider = '', reasonCode = '',
            candidates, maxperf, bestperf = Infinity,
            asn = request.asn;

        // Sanitize Fusion data
        Object.keys(dataFusion).forEach( 
            function (key) { if (isNaN(dataFusion[key] = parseFloat(dataFusion[key]))) delete dataFusion[key]; }
        );

        // Anti-DDOS
        /**
        if (country === 'DE') {
            decisionProvider = 'origin';
            reasonCode = allReasons.best_performing;
        } else {
            delete(settings.providers.origin);
        }
        */
        // Fin A-DDOS

        if (settings.asn_override[asn] !== undefined
            && settings.asn_override[asn].provider !== undefined
            && settings.asn_override[asn].fallback !== undefined) {

            var candidate = settings.asn_override[asn].provider,
                fallback = settings.asn_override[asn].fallback;

            if (dataAvail[candidate] !== undefined && dataAvail[candidate].avail >= settings.availability_threshold) {
                decisionProvider = candidate;
                reasonCode = allReasons.asn_override;
            } else {
                decisionProvider = fallback;
                reasonCode = allReasons.asn_override_fallback;
            }
        }

        if (decisionProvider === '') {
            Object.keys(dataRtt).forEach( function(key) {
                var newCandidate;

                // If the provider is not available remove it
                if (dataAvail[key] === undefined || dataAvail[key].avail < settings.availability_threshold) {
                    delete(dataRtt[key]);
                    return;
                }

                // Check Fusion Data Penal
                if (settings.providers[key].penal === true && dataFusion[key] !== undefined) {
                    settings.providers[key].padding = dataFusion[key] - 100;
                }

                // Adds surpenal
                if (settings.providers[key].penal === true && settings.providers[key].surpenal !== undefined) {
                    settings.providers[key].padding += settings.providers[key].surpenal;
                }

                // Compute padding with care of max_delta
                newCandidate = dataRtt[key].http_rtt * (1 + settings.providers[key].padding / 100);
                if (Math.abs(newCandidate - dataRtt[key].http_rtt) < settings.max_delta
                    || settings.providers[key].padding > settings.security_threshold) {
                    dataRtt[key].http_rtt = newCandidate;
                } else {
                    if (settings.providers[key].padding >= 0) dataRtt[key].http_rtt += settings.max_delta;
                    else dataRtt[key].http_rtt -= settings.max_delta;
                }

                // keep bestperf for later use
                if (dataRtt[key].http_rtt < bestperf) {
                    bestperf = dataRtt[key].http_rtt;
                }
            });

            // ramdomly select between candidates with good perf
            maxperf = bestperf + settings.random_threshold;
            candidates = Object.keys(dataRtt).filter( function (key) { return dataRtt[key].http_rtt <= maxperf; });
            if (candidates.length > 0) {
                decisionProvider = candidates[Math.floor(Math.random() * candidates.length)];
                reasonCode = allReasons.best_performing;
            }
        }

        if (decisionProvider === '') {
            // No provider selected. Use fallback.
            decisionProvider = aliases[0];
            reasonCode = allReasons.data_problem;
        }

        response.respond(decisionProvider, settings.providers[decisionProvider].cname);
        response.setTTL(settings.default_ttl);
        response.setReasonCode(reasonCode);
    };

}