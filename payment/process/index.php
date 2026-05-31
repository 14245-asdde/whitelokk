<?php
require $_SERVER['DOCUMENT_ROOT'] . '/payment/functions.php';
require $_SERVER['DOCUMENT_ROOT'] . '/payment/config.php';
require $_SERVER['DOCUMENT_ROOT'] . '/payment/validate.php';
require $_SERVER['DOCUMENT_ROOT'] . '/payment/db.php';

$group = db_query($db, "SELECT * FROM luckperms_players WHERE username = ? LIMIT 1", [$get_array['nick']]);

$lpPrice = 0;
if ($group) {
    $group = $group[0]['primary_group'];
    foreach ($config['categories'] as $key => $value) {
        $item = $value['products'][$group];
        if ($item != null) {
            $lpPrice = $item;
            if ($item['withSurcharge']) {
                $lpPrice = $item['price'];
            }
            break;
        }
    }
}

$totalPrice = 0;
$totalPriceDiscount = 0;

$buyItems = $get_array['cart'];
$items = [];
foreach ($buyItems as $buyItem) {
    $buyItemId = explode('_', $buyItem['id']);
    $category = $buyItemId[0];
    $product = $buyItemId[1];
    $product = $config['categories'][$category]['products'][$product];
    if ($product) {
        if ($product['withSurcharge']) {
            if ($product['price'] <= $lpPrice) {
                error("Вы уже имейте " . $product['title']);
            }
        }
        $totalPrice += ($product['price'] * ((100 - $product['discount']) / 100)) * $buyItem['qty'];
        $totalPriceDiscount += $product['price'] * $buyItem['qty'];
        $items[] = ['id' => $buyItemId[1], 'qty' => $buyItem['qty']];
    } else {
        error("Ошибка покупки");
    }
}

$paymentQuery = db_query($dbShop, "INSERT INTO payments (nick, email, goods, price, status) VALUES (?, ?, ?, ?, 0)", [
    $get_array['nick'], $get_array['email'], json_encode($get_array['cart']), $totalPrice
]);

$db_id = db_last_id($dbShop);

if ($db_id == 0) {
    $db_id = db_query($dbShop, "SELECT id FROM payments WHERE nick = ? AND email = ? AND goods = ? AND status = 0 LIMIT 1", [
        $get_array['nick'], $get_array['email'], json_encode($get_array['cart'])
    ]);
    $db_id = $db_id[0]["id"];
}

if ($db_id == 0)
    //redirect("/");
    exit;

$link = payment_link($config, $db_id, $totalPrice, $get_array['payment']);
redirect($link);

function payment_link($config, $payNum, $price, $input_method) {
    $desc = "Покупка игровой привилегии на сайте {$config['site_name']}";

    $methods = [
        'qiwi' => [
            'payment' => 'qiwi',
            'method' => 'qiwi'
        ],
        'card' => [
            'payment' => 'card',
            'method' => 'qiwi'
        ],
        'yoomoney' => [
            'payment' => 'yandex',
            'method' => 'enot'
        ],
        'mts' => [
            'payment' => 'mts',
            'method' => 'payok'
        ],
        'megafon' => [
            'payment' => 'megafon',
            'method' => 'payok'
        ],
        'tele2' => [
            'payment' => 'tele2',
            'method' => 'payok'
        ],
        'card_gateway' => [
            'payment' => 'card',
            'method' => 'enot'
        ],
    ];

    $payment = htmlspecialchars(addslashes($methods[$input_method]['payment']));
    $method = htmlspecialchars(addslashes($methods[$input_method]['method']));
    $link = '';

    switch ($method) {
        case "qiwi" :

            switch ($payment) {
                case "qiwi" :
                    $link = "https://oplata.qiwi.com/create?publicKey={$config['qiwi']['public_key']}&amount={$price}&account={$payNum}&paySource=qw&comment={$desc}&successUrl=https://ragemine.su/";
                    break;
                case "card" :
                    $link = "https://oplata.qiwi.com/create?publicKey={$config['qiwi']['public_key']}&amount={$price}&account={$payNum}&paySource=card&comment={$desc}&successUrl=https://ragemine.su/";
                    break;
                default:
                    $link = "https://oplata.qiwi.com/create?publicKey={$config['qiwi']['public_key']}&amount={$price}&account={$payNum}&comment={$desc}&successUrl=https://ragemine.su/";
                    break;
            }
            break;

        case "unitpay" :
            $sign = getFormSignature($payNum, $desc, $price, $config['unitpay']['key']);

            switch ($payment) {
                case "card" :
                    $link = "https://unitpay.money/pay/{$config['unitpay']['project_id']}/card?sum={$price}&account={$payNum}&desc={$desc}&signature={$sign}&hideMenu=true";
                    break;
                case "megafon" :
                    $link = "https://unitpay.money/pay/{$config['unitpay']['project_id']}/mc?sum={$price}&account={$payNum}&desc={$desc}&signature={$sign}&operator=mf&hideMenu=true";
                    break;
                case "tele2" :
                    $link = "https://unitpay.money/pay/{$config['unitpay']['project_id']}/mc?sum={$price}&account={$payNum}&desc={$desc}&signature={$sign}&operator=tele2&hideMenu=true";
                    break;
                case "applepay" :
                    $link = "https://unitpay.money/pay/{$config['unitpay']['project_id']}/applepay?sum={$price}&account={$payNum}&desc={$desc}&signature={$sign}&hideMenu=true";
                    break;
                case "samsungpay" :
                    $link = "https://unitpay.money/pay/{$config['unitpay']['project_id']}/samsungpay?sum={$price}&account={$payNum}&desc={$desc}&signature={$sign}&hideMenu=true";
                    break;
                default:
                    $link = "https://unitpay.money/pay/{$config['unitpay']['project_id']}/?sum={$price}&account={$payNum}&desc={$desc}&signature={$sign}&hideMenu=true";
                    break;
            }
            break;

        case "enot" :
            $sign = md5($config['enot']['public_key'].':'.$price.':'.$config['enot']['secret_key'].':'.$payNum);

            switch ($payment) {
                case "yandex":
                    $link = "https://enot.io/_/pay?m={$config['enot']['public_key']}&oa={$price}&o={$payNum}&s={$sign}&p=ya";
                    break;
                case "card":
                    $link = "https://enot.io/_/pay?m={$config['enot']['public_key']}&oa={$price}&o={$payNum}&s={$sign}&p=cd";
                    break;
                default:
                    $link = "https://enot.io/_/pay?m={$config['enot']['public_key']}&oa={$price}&o={$payNum}&s={$sign}";
                    break;
            }
            break;

        case "payok":
            $paymentId = round(gettimeofday(true));
            $sign = md5(implode('|', array($price, $paymentId, $config['payok']['public_key'], 'RUB', $desc, $config['payok']['secret_key'])));

            switch ($payment) {
                case "megafon" :
                    $link = "https://payok.io/pay?amount={$price}&payment={$paymentId}&shop={$config['payok']['public_key']}&desc={$desc}&sign={$sign}&account={$payNum}&method=mg";
                    break;
                case "tele2" :
                    $link = "https://payok.io/pay?amount={$price}&payment={$paymentId}&shop={$config['payok']['public_key']}&desc={$desc}&sign={$sign}&account={$payNum}&method=tl";
                    break;
                default:
                    $link = "https://payok.io/pay?amount={$price}&payment={$paymentId}&shop={$config['payok']['public_key']}&desc={$desc}&sign={$sign}&account={$payNum}";
                    break;
            }
            break;
        default:
            die();
    }
    return $link;
}