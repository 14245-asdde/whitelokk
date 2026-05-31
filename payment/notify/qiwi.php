<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/functions.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/config.php';
require_once __DIR__ . '/result.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/vendor/autoload.php';

if (!function_exists('getallheaders')) {
  function getallheaders() {
  $headers = [];
  foreach ($_SERVER as $name => $value) {
      if (substr($name, 0, 5) == 'HTTP_') {
          $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
      }
  }
  return $headers;
  }
}

file_put_contents('datatest.json', var_export(getallheaders(), true));

$validSignatureFromNotificationServer = getallheaders()["X-Api-Signature-Sha256"];
$notificationData = file_get_contents('php://input');

$notificationData = json_decode($notificationData, true);

if ($notificationData == null)
    redirect("/");

$billPayments = new Qiwi\Api\BillPayments($config['qiwi']['secret_key']);
$verify = $billPayments->checkNotificationSignature(
    $validSignatureFromNotificationServer, $notificationData, $config['qiwi']['secret_key']
);



if ($verify) {
    unset($_SESSION);

    $params = array(
        'account' => $notificationData['bill']['customer']['account'],
        'sum' => intval($notificationData['bill']['amount']['value'])
    );

    result($params['account'], $params['sum']);

    echo '{
    "error":"0"
    }';
}
