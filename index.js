const TelegramBot = require('node-telegram-bot-api');

// Replace with your own bot token from BotFather
const token = '6964819858:AAGgyDNrOyk4c5ZaqIx0aRdcFoZpHhfUhdg';
const bot = new TelegramBot(token, { polling: true });
    
// States to manage the conversation
const states = {};
const targetChatId = -4280658152; // Target chat ID where the collected data should be sent

// Handle the /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Assalomu aleykum, bizning Progme Taxo loyhamizga xush kelibsiz. Biz bu bot orqali sizning kundalik hayotingizga oz bo\'lsada yordam bermoqchimiz. Kompanya PROGME');
    states[chatId] = { step: 'name' };

    // Delay before asking the first question
    setTimeout(() => {
        bot.sendMessage(chatId, 'Iltimos, ismingizni kiriting:');
    }, 1000); // 1 second delay before asking for the name
});

// Handle other messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!states[chatId]) {
        return;
    }
    
    switch (states[chatId].step) {
        case 'name':
            states[chatId].name = msg.text;
            states[chatId].step = 'phone';
            bot.sendMessage(chatId, 'Rahmat! Endi, telefon raqamingizni kiriting \u{1F4F1}:');
            break;
        case 'phone':
            states[chatId].phone = msg.text;
            states[chatId].step = 'location';
            bot.sendMessage(chatId, 'Ajoyib! Iltimos, o\'zingizning joylashuvingizni ulashing \u{1F4CD}:', {
                reply_markup: {
                    keyboard: [[{
                        text: 'Joylashuvni yuborish',
                        request_location: true
                    }]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
            break;
        case 'location':
            if (msg.location) {
                states[chatId].location = msg.location;
                states[chatId].step = 'product';
                bot.sendMessage(chatId, 'Rahmat! So\'ng, Izoh yokida borar joyingizni yozib qoldiring:');
            } else {
                bot.sendMessage(chatId, 'Iltimos, joylashuvingizni yuborish uchun tugmani ishlating \u{1F4CD}.');
            }
            break;
        case 'product':
            states[chatId].product = msg.text;

            const { name, phone, location, product } = states[chatId];
            const locationLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

            const message = `Rahmat! Siz kiritgan ma'lumotlar:
Ism: ${name}
Telefon: ${phone}
Joylashuv: ${locationLink}
Mahsulot: ${product}`;

            // Send the information to the specified chat ID with inline buttons
            bot.sendMessage(targetChatId, message, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Qabul✅', callback_data: `accept_${chatId}` },
                            { text: 'Bekor❌', callback_data: `decline_${chatId}` }
                        ]
                    ]
                }
            });
            
            // Send a thank you message to the user with a smiling emoji
            bot.sendMessage(chatId, '5 daqiqa kutib turing taksi oldingizda bo\'ladi! \u{1F60A}');
            
            // Clear the state
            delete states[chatId];
            break;
    }
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
    const { data, message } = callbackQuery;
    const [action, chatId] = data.split('_');

    if (action === 'accept') {
        bot.sendMessage(chatId, 'Taksi topildi! \u{1F44D}');
    } else if (action === 'decline') {
        bot.sendMessage(chatId, 'Taksi topilmadi.');
    }

    // Edit the original message to remove the inline buttons
    bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: message.chat.id, message_id: message.message_id }
    );

    // Acknowledge the callback query
    bot.answerCallbackQuery(callbackQuery.id);
});
