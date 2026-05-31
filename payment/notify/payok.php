<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/functions.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/config.php';
require_once __DIR__ . '/result.php';

$secret = $config['payok']['secret_key']; // Ваш секретный ключ

// Занесение параметров в массив
$array = array (

$secret,
$desc = $_POST['desc'],
$currency = $_POST['currency'],
$shop = $_POST['shop'],
$payment_id = $_POST['payment_id'],
$amount = $_POST['amount']

);

// Соединение массива в строку и хеширование функцией md5
$sign = md5 ( implode ( '|', $array ) );

IF ( $sign != $_POST[ 'sign' ] ) {
die( 'Подпись не совпадает.' );
}

// Все хорошо, выполняйте ваш код

$email = $_POST[ 'email' ]; // Электронная почта пользователя
$profit = $_POST[ 'profit' ]; // Сумма к получению
$date = $_POST[ 'date' ]; // Дата операции
$method = $_POST[ 'method' ]; // Способ оплаты

// Переданные вами параметры
$account = $_POST['custom']['account'];
result($account, $amount);
?>
