<?php

    //die('TEST DISABLED');

    require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/functions.php';
    require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/config.php';
    require('./notify/result.php');
    result($_GET['account'], $_GET['amount']);

?>