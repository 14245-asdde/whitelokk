<?php
require('payment/config.php');

function fcost($cost)
{
  return number_format($cost, 0, ',', ' ') . ' ₽';
}

?>
<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="description" content="" />
  <meta name="keywords" content="" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Главная | RageMine" />
  <meta property="og:site_name" content="" />
  <meta property="og:url" content="" />
  <meta property="og:description" content="" />
  <meta property="og:image" content="" />
  <meta property="og:image:type" content="image/webp" />
  <meta property="og:image:width" content="400" />
  <meta property="og:image:height" content="300" />
  <meta name="color-scheme" content="light dark" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="" />
  <link rel="preload" href="fonts/TTNormsPro-Medium.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="shortcut icon" href="img/logo_orange.webp" type="image/webp" />
  <link rel="stylesheet" href="css/style.min.css?_v=20220415191341" />
  <script>
    function tes() {
      var A = document.querySelector("html");
      if (null !== A) {
        var a = function(a, e) {
            if (a < 2) return A.classList.add("no-" + e);
            A.classList.add(e);
          },
          e = new Image();
        (e.onload = e.onerror =
          function() {
            return a(e.height, "avif");
          }),
        (e.src =
          "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=");
        var B = new Image();
        (B.onload = B.onerror =
          function() {
            return a(B.height, "webp");
          }),
        (B.src =
          "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA");
      }
    }
    tes();
  </script>
  <title>Главная | RageMine</title>
</head>

<body>
  <div class="wrapper" data-menu-overlay>
    <header class="header">
      <div class="header__container">
        <a class="header__logo logo" href="/">
          <picture>
            <source srcset="img/logo_orange.avif" type="image/avif" />
            <source srcset="img/logo_orange.webp" type="image/webp" />
            <img src="img/logo_orange.png" alt="логотип" width="70" height="80" />
          </picture>
        </a>
        <nav class="header__nav">
          <ul class="header__list">
            <li class="header__item">
              <a class="header__link" href="/">Главная</a>
            </li>
            <li class="header__item">
              <a class="header__link" href="https://vk.com/topic-212358376_48572452" target="_blank">Правила</a>
            </li>
            <li class="header__item">
              <a class="header__link" href="https://vk.com/ragemine" target="_blank">ВКонтакте</a>
            </li>
          </ul>
        </nav>
        <button class="header__btn btn" type="button">
          <span class="header__ip">mc.ragemine.su</span><span class="header__online"><?php echo (file_get_contents("https://mcapi.xdefcon.com/server/mc.ragemine.su/players/text")); ?></span>
        </button>
        <div class="header__burger">
          <button class="burger btn" type="button"><span></span></button>
        </div>
      </div>
      <div class="burger__menu"></div>
    </header>
    <main class="page">
      <section class="products">
        <div class="products__container">
          <aside class="asidebar">
            <button class="cart" id="cart" type="button" data-da=".header__container,47.9375,first">
              <div class="cart__block-text">
                <div class="cart__title">Ваша корзина</div>
                <div class="cart__info">
                  <span id="cartNull">ПУСТУЕТ И ГРУСТИТ: (</span><span id="cartFull" hidden><span id="cartQuantity"></span>
                    <span id="cartQuantityText"></span>
                    <span style="color: #7e5b47">| </span><span id="cartCost">0</span> ₽</span>
                </div>
              </div>
              <div class="cart__icon">
                <svg class="basket" style="fill: currentColor" aria-hidden>
                  <use xlink:href="img/icons/icons.svg#svg-basket"></use>
                </svg>
              </div>
            </button>
            <div class="cart-menu" data-simplebar>
              <button class="cart-menu__close btn btn_orange" id="cart">
                <svg class="close" style="fill: #141717" aria-hidden>
                  <use xlink:href="img/icons/icons.svg#svg-close"></use>
                </svg>
              </button>
              <div class="cart-menu__title cart__title">Корзина</div>
              <div class="cart-menu__info">
                <span id="cartNull">ПУСТУЕТ И ГРУСТИТ: (</span><span id="cartFull" hidden><span id="cartQuantity"></span>
                  <span id="cartQuantityText"></span>
                  <span style="color: #7e5b47">| </span><span id="cartCost">0</span> ₽</span>
              </div>
              <div class="cart-menu__items"></div>
              <button class="cart-menu__btn btn btn_green_light" type="button" data-popup="#popup_cart">
                Перейти к оформлению
              </button>
              <button class="cart-menu__btn_gray" type="button">
                Продолжить покупки
              </button>
            </div>
            <div class="category">
              <div class="category__title">КАТЕГОРИИ ТОВАРОВ</div>
              <nav class="category__list" data-tabs data-da=".burger__menu,47.9375,first">
                <?php foreach ($config['categories'] as $k => $v) : ?>

                  <button class="category__item" type="button" data-active>
                    <div class="category__item-title"><?= $v['title'] ?></div>
                    <div class="category__icon">
                      <img src="img/category/<?= $k ?>.png" alt="" width="40" height="40">
                    </div>
                  </button>
                <?php endforeach; ?>
              </nav>
            </div>
          </aside>
          <div class="products__tabs" data-panes>
            <?php foreach ($config['categories'] as $k => $v) : ?>
              <div class="products__list">
                <?php foreach ($v['products'] as $item => $itemData) : ?>
                  <div class="products__item" data-qty="<?= $itemData['qty'] ? '1' : '0' ?>" data-id="<?= $k ?>_<?= $item ?>">
                    <picture>
                      <img class="products__item-img" src="<?= $itemData['image'] ?>" alt="<?= $itemData['title'] ?>" width="166" height="145" />
                    </picture>
                    <div class="products__item-title"><?= $itemData['title'] ?></div>
                    <div class="products__item-price"><?= fcost($itemData['price']) ?></div>
                    <div class="products__item-btns">
                      <button class="products__item-btn-info btn_blue btn-quantity btn" type="button" data-popup="#popup_info">
                        <svg class="info" style="fill: currentColor;" aria-hidden>
                          <use xlink:href="img/icons/icons.svg#svg-info"></use>
                        </svg>
                      </button>
                      <button class="products__item-btn-cart btn_green btn" type="button">В корзину</button>
                      <div class="products__item-quantity">
                        <button class="products__item-btn-minus btn_red btn-quantity btn" type="button">
                          <svg class="minus" style="fill: currentColor;" aria-hidden>
                            <use xlink:href="img/icons/icons.svg#svg-minus"></use>
                          </svg>
                        </button>
                        <div class="products__item-count" id="productQuantity">1</div>
                        <button class="products__item-btn-plus btn_green btn-quantity btn" type="button"></button>
                      </div>
                    </div>
                  </div>
                <?php endforeach; ?>
              </div>
            <?php endforeach; ?>
          </div>
      </section>
    </main>
    <footer class="footer">
      <div class="footer__container">
        <a class="footer__logo logo" href="/">
          <picture>
            <source srcset="img/logo_orange.avif" type="image/avif" />
            <source srcset="img/logo_orange.webp" type="image/webp" />
            <img src="img/logo_orange.png" alt="логотип" width="52" height="60" />
          </picture>
        </a>
        <div class="footer__block-copyright">
          <div class="footer__copyright-title">
            RAGEMINE 2022 © Все права защищены
          </div>
          <p class="footer__copyright-text">
            ИП Акулов Дмитрий Владимирович<br />ОГРНИП: 322745600025171<br />Контактная
            почта:
            <a class="footer__copyright-link" href="mailto:ilya.batukhtin@gmail.com">help@ragemine.su</a>
          </p>
        </div>
        <div class="footer__block-politics" data-da=".footer__container,62, 4">
          <p class="footer__politics-text">
            RAGEMINE не связан с Mojang AB.<br />Все средства идут на развитие
            проекта<br />Коммерческая деятельность проекта<br />соответствует
            <a class="footer__politics-link" href="/mojang.pdf" target="_blank">политике Mojang AB.</a>
          </p>
        </div>
        <nav class="footer__nav">
          <ul class="footer__list">
            <li class="footer__item">
              <a class="footer__link" href="/">Главная</a>
            </li>
            <li class="footer__item">
              <a class="footer__link" href="https://vk.com/topic-212358376_48572452" target="_blank">Правила</a>
            </li>
            <li class="footer__item">
              <a class="footer__link" href="/oferta.html" target="_blank">Договор-оферты</a>
            </li>
            <li class="footer__item">
              <a class="footer__link" href="/privacy.html" target="_blank">Политика конфиденциальности</a>
            </li>
          </ul>
        </nav>
        <div class="footer__socials socials">
          <a class="footer__social socials__item socials__item_discord" href="https://discord.gg/s9szfN6Q4b" target="_blank"><svg class="discord" style="fill: currentColor" aria-hidden>
              <use xlink:href="img/icons/icons.svg#svg-discord"></use>
            </svg></a><a class="footer__social socials__item socials__item_vk" href="https://vk.com/ragemine" target="_blank"><svg class="vk" style="fill: currentColor" aria-hidden>
              <use xlink:href="img/icons/icons.svg#svg-vk"></use>
            </svg></a><a class="footer__social socials__item socials__item_tg" href="https://t.me/ragemine_help" target="_blank"><svg class="tg" style="fill: currentColor" aria-hidden>
              <use xlink:href="img/icons/icons.svg#svg-tg"></use>
            </svg></a>
        </div>
      </div>
    </footer>
    <div class="popup" id="popup_info" aria-hidden="true">
      <div class="popup__wrapper">
        <div class="popup__content popup__content_info">
          <button class="popup__close btn btn_orange" data-close>
            <svg class="close" style="fill: #141717" aria-hidden>
              <use xlink:href="img/icons/icons.svg#svg-close"></use>
            </svg>
          </button>
          <div class="popup__title">Какой-то донат</div>
          <div class="popup__wrapper_info" data-simplebar>
            <div class="popup__block-info">
              <div class="popup__title_info">Возможности</div>
              <p class="popup__text_info">
                Работа - это не волк, работа - это ворк
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="popup" id="popup_cart" aria-hidden="true">
      <div class="popup__wrapper">
        <div class="popup__content popup_cart__content">
          <button class="popup__close btn btn_orange" data-close>
            <svg class="close" style="fill: #141717" aria-hidden>
              <use xlink:href="img/icons/icons.svg#svg-close"></use>
            </svg>
          </button>
          <div class="popup__title">Корзина</div>
          <form class="popup__form" id="form" action="#" method="post">
            <fieldset class="popup__fieldset">
              <label class="popup__label">Ваш никнейм
                <input class="popup__input" id="name" name="nickname" placeholder="darkakyloff" required /></label>
              <label class="popup__label">Ваша почта
                <input class="popup__input" id="email" type="email" name="email" placeholder="help@ragemine.su" required /></label>
              <label class="popup__label">Ваш промокод
                <input class="popup__input" name="promocode" placeholder="Промокод (если имеется)" /></label>
            </fieldset>
            <div class="popup_cart__payment">
              <span>К оплате:</span>
              <div class="popup_cart__price">
                <s>0 ₽</s><span>0 ₽</span>
              </div>
            </div>
            <button class="popup_cart__btn btn btn_green_light" data-popup="#popup_payment">
              Перейти к оплате
            </button>
          </form>
        </div>
      </div>
    </div>
    <div class="popup" id="popup_payment" aria-hidden="true">
      <div class="popup__wrapper">
        <div class="popup__content popup_cart__content">
          <button class="popup__close btn btn_orange" data-close>
            <svg class="close" style="fill: #141717" aria-hidden>
              <use xlink:href="img/icons/icons.svg#svg-close"></use>
            </svg>
          </button>
          <div class="popup__title">Способ оплаты</div>
            <form id="form2" method="POST" action="/payment/process/">
              <input type="hidden" name="payment">
              <input type="hidden" name="data">
              <div class="popup_payment__items">
                <a class="popup_payment__item popup_payment__item_card" data-payment="card" href="#" style="
                      background: url('img/payment/card.jpg') center/cover no-repeat;
                    "></a><a class="popup_payment__item popup_payment__item_qiwi" data-payment="qiwi" href="#" style="
                      background: url('img/payment/qiwi.jpg') center/cover no-repeat;
                    "></a><a class="popup_payment__item popup_payment__item_yoomoney" data-payment="yoomoney" href="#" style="
                      background: url('img/payment/yoomoney.jpg') center/cover
                        no-repeat;
                    "></a><a class="popup_payment__item popup_payment__item_mts" data-payment="mts" href="#" style="
                      background: url('img/payment/mts.jpg') center/cover no-repeat;
                    "></a><a class="popup_payment__item popup_payment__item_megafon" data-payment="megafon" href="#" style="
                      background: url('img/payment/megafon.jpg') center/cover
                        no-repeat;
                    "></a><a class="popup_payment__item popup_payment__item_tele2" data-payment="tele2" href="#" style="
                      background: url('img/payment/tele2.jpg') center/cover
                        no-repeat;
                    "></a>
              </div>
              <div class="popup_payment__gateway">
                <div class="popup_payment__gateway-title">
                  В СЛУЧАЕ ОШИБКИ ПЛАТЕЖА ПОПРОБУЙТЕ ДРУГОЙ МЕТОД ОПЛАТЫ КАРТОЙ
                </div>
                <a class="popup_payment__item popup_payment__item_card_gateway" data-payment="card_gateway" href="#" style="
                      background: url('img/payment/card_gateway.jpg') center/cover
                        no-repeat;
                    "></a>
              </div>
          </form>
          <div class="popup_payment__agree">
            Нажимая на одну из выше указанных кнопок, вы даёте свое согласие
            с политикой обработки
            <a>персональных данных и пользовательским соглашением.</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script src="js/app.min.js?_v=20220415191341"></script>
</body>

</html>