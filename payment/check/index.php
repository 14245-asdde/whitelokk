<?php
    require $_SERVER['DOCUMENT_ROOT'] . '/payment/functions.php';
    require $_SERVER['DOCUMENT_ROOT'] . '/payment/config.php';
    require $_SERVER['DOCUMENT_ROOT'] . '/payment/validate.php';
    require $_SERVER['DOCUMENT_ROOT'] . '/payment/db.php';
    header('Content-Type: application/json');

    $group = db_query($db, "SELECT * FROM luckperms_players WHERE username = ? LIMIT 1", [$get_array['nick']]);
    $lpPrice = 0;
    if ($group) {
        $group = $group[0]['primary_group'];
        foreach ($config['categories'] as $key => $value) {
            $item = $value['products'][$group];
            if ($item != null) {
                $lpPrice = $item;
                if ($item['withSurcharge']) {
                    $lpPrice =$item['price'];
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
            error("Корзина пуста");
        }
    }
        

    echo json_encode(array(
        'status' => 'ok',
        'data' => $get_string,
        'items' => $items,
        'price' => $totalPrice,
        'withoutDiscountPrice' => $totalPriceDiscount,
        'displayPriceDiscount' => fcost($totalPriceDiscount),
        'displayPrice' => fcost($totalPrice)
        
    ));
?>