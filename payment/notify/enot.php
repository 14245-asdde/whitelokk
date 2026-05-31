<?php

    require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/functions.php';
    require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/config.php';
    require_once __DIR__ . '/result.php';

    $account = $_REQUEST['merchant_id'];
    $amount = $_REQUEST['amount'];
    $sign = $_REQUEST['sign_2'];

    $real_sign = md5($config['enot']['public_key'].':'.$amount.':'.$config['enot']['secret_key'].':'.$account);

    if($sign != $real_sign) {
        die('Не проверена подпись!');
    }

    result($account, $amount);

    die('Ok');
?>