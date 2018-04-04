<?php

class OpenmixApplication implements Lifecycle
{
    private $ttl = 20;

    # This needs to be set after the app is initially uploaded.
    private $app = '2-01-2a40-0002';

    /**
     * @param Configuration $config
     */
    public function init($config)
    {
        // This is used to indicate which app to bounce to.
        $config->declareInput(RequestProperties::HOSTNAME);
        $config->declareResponseOption('anycast', 'anycast', $this->ttl);
    }
    
    /**
     * @param Request $request
     * @param Response $response
     * @param Utilities $utilities
     */
    public function service($request,$response,$utilities) {
        $hostname = $request->request(RequestProperties::HOSTNAME);
        //print("\nHostname: $hostname");
        $response->selectProvider('anycast');
        if(0 === strncmp($hostname, "start-", 6)) {
            # Second time through: extract initial time, calculate rtt.
            $start = (float)substr($hostname,6,21);
            //print("\nStart: $start");
            $rtt = intval(($this->get_microtime() - $start) * 1000);
            //print("\nRTT: $rtt");
            if ($rtt < 0) {
                $rtt = 0;
            } 
            $response->setCName(
                # Third Request goes to a separate app for recording RTT results
                $rtt . '.2-01-2a40-0006.cdx.ecedexis.net'
            );
        }
        else {
            # First time through: bounce back to this app with current start time
            $response->setCName(
                'start-' .
                sprintf("%020.6f", $this->get_microtime()) . 'x.' .
                $this->app .
                '.cdx.ecedexis.net'
            );
        }
    }

    public function get_microtime() {
        return microtime(true);
    }
}
?>