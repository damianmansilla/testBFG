<?php

require_once 'TestHelper.php';
require_once(APP_DIR . '/OpenmixApplication.php');

class OpenmixApplicationTests extends PHPUnit_Framework_TestCase
{
    /**
     * @test
     */
    public function init()
    {
        $config = $this->getMock('Configuration');
        $application = new OpenmixApplication();
        $application->init($config);
    }
    
    /**
     * @test
     */
    public function service()
    {
        $test_data = array(
            array(
                'desc' => 'Start 1379554659.4549 microseconds',
                'hostname' => '',
                'microtime' => floatval('1379554659.4549'),
                'cname' => 'start-0001379554659.454900x.2-01-2a40-0002.cdx.ecedexis.net',
            ),
            array(
                'desc' => 'Stop 1379555659.4549 microseconds',
                'hostname' => 'start-0001379554659.454900x',
                'microtime' => floatval('1379555659.4549'),
                'cname' => '1000000.2-01-2a40-0006.cdx.ecedexis.net',
            ),
        );

        $test_index = 0;
        foreach ($test_data as $i) {
            print("\nTest " . $test_index++ . ': ' . $i['desc']);
            $request = $this->getMock('Request');
            $response = $this->getMock('Response');
            $utilities = $this->getMock('Utilities');
            $application = $this->getMock('OpenmixApplication', array('get_microtime'));

            $call_index = 0;
            $request->expects($this->at($call_index++))
                ->method('request')
                ->with('string:request:hostname')
                ->will($this->returnValue($i['hostname']));

            $application->expects($this->once())
                ->method('get_microtime')
                ->will($this->returnValue($i['microtime']));

            $response->expects($this->once())
                ->method('setCName')
                ->with($i['cname']);

            $application->service($request, $response, $utilities);
        }
    }
}

?>