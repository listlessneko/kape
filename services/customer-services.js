// not that kind of customer service... well, maybe kinda.
// an alternative to JSON because it JSON is incapable of creating dynamic content (or i have no clue how)
// so we're rolling with this.
// Is it practical AND efficient? I don't know...
// Will it work? Yes.

import { logger } from '../logger.js';
import { FormatServices } from './format-services.js';

const serviceName = 'CustomerServices';

export const CustomerServices = {

  /**
   * Returns a random customer's scripted response to the barista depending on the current status of the interaction or order. This response includes dynamic content particularly the random item chosen for them.
   *
   * @param {object} fateOrder An object containing the random number that determines which customer is chosen and the item's name.
   * @returns An object containing that customer's response with the name of the item being filled in the dialogue.
   *
   */

  fateCustomerDialogue(fateOrder) {
    const functionName = `${serviceName}.fateCustomerDialogue`;

    fateOrder.displayName = {
      a: `**${fateOrder.name}**`,
      b: `${FormatServices.aOrAn(fateOrder.name, 'bold')}`,
    }
    const customerDialogue = [
      {
        name: 'Claire',
        order: `**Customer**: Hey. I'll have one ${fateOrder.displayName.a}, please.`,
        canceled: `*After several minutes, the customer returns and impatiently asks...*\n\n**Customer**: Excuse me. Where's my drink?\n\n*You stare back at them with a blank expression and even ignore to respond.*\n\n*How rude of you. The customer stormed out.*`,
        acceptable: `**Customer:** *(They take a sip and slightly furrows their brow.)* Hmm... Is this the right drink?\n\n**You**: Yeah. *(You nervously nod back because you're not even sure)*`,
        incorrect: `*The customer takes a sip and immediately furrows their brow. Their glaring eyes dart towards yours.*\n\n**Customer**: Um... this isn't what I ordered.`,
        incorrectAgain: `*The customer takes a sip and the same knitted brows appears over their eyes.*\n\n**Customer**: *(Heavily sighs)* Hey–.\n\n**Co-worker**: Oh, sorry! That was for someone else. (*To you*: I'll take it from here.)`,
        correct: `*The customer takes a sip and you notice a slight curl at one corner of their lip.*`,
      },
      {
        name: 'Lucie',
        order: `*While tapping away at the phone in their hands...*\n\n**Customer**: I'll get ${fateOrder.displayName.b}.`,
        canceled: `**Customer**: Hey. Where's my drink? I've been waiting for several minutes.\n\n*You stare back at them with a blank expression and even ignore to respond.*\n\n*How rude of you. The customer stormed out.*`,
        acceptable: `*Head buried in their phone, the customer wanders over to the counter, grabs the cup, and walks away without looking up. A few moments later, you question if you made it correctly.*`,
        incorrect: `*Head buried in their phone, the customer wanders over to the counter, grabs the cup, and walks away without looking up. A few minutes later, they reappear with knitted brows.*\n\n**Customer**: Hey. This isn't what I ordered.`,
        incorrectAgain: `*No longer on their phone, they anxiously meander back to the counter and stare at the cup with disappointment.*\n\n**Co-worker**: Sorry! We meant the other person with the same very common, but very nice name. (*To you*: I'll make this one.)`,
        correct: `*You call the customer's name and they happily pick up their drink from the counter.*`,
      },
      {
        name: 'Edel',
        order: `*The customer approaches the counter with their arms crossed and one set of fingers rapidly tapping around their elbow in a rythmic fashion.*\n\n**Customer**: Excuse me. I'll have ${fateOrder.displayName.b} to-go.`,
        canceled: `*The customer returns to the counter and impatiently asks one of your co-workers...*\n\n**Customer**: Excuse me. Is my drink ready yet?\n\n***Hanako**, your senior and the only barista on the floor replies with a forced smile...*\n\n**Hanako**: Your drink is coming soon! Please wait a little longer.\n\n*While the customer reluctantly nods, you see **Hanako's** furiously shift from one end of the station to the other. You feel the heat of her glaring eyes almost graze you as their rays pass by the kitchen doors you've hid yourself behind.*`,
        acceptable: `*The customer winces at the first sip. Their glaring eyes dart towards you and they appear as though they are about to pierce you. But they pull them back and saunter out the door.*`,
        incorrect: `*As soon as you turn away, the customer calls.*\n\n**Customer**: Excuse me! This isn't the right order.`,
        incorrectAgain: `*You place the cup on the counter and run to the back.*\n\n**Customer**: Excuse me!\n\n**Co-worker**: *(Heavily sighs)* Sorry about that. I'll start on your drink.`,
        correct: `*You turn away half expecting the customer to call you over, but instead you just feel a cool wind rub against the back of your neck. You turn back around and find the customer and drink nowhere to be found.*`
      },
      {
        name: 'Arvind',
        order: `*As the previous customer walks away, the next's eyes seem to bounce between two sections of the menu.*\n\n**Customer**: Hello. I'll have ${fateOrder.displayName.b}.`,
        canceled: `*The customer comes back to the counter with concerning eyes...*\n\n**Customer**: Excuse me, but where's the drink I ordered?\n\n*While in the middle of making a different drink **Hanako** looks around to notice she's the only one at the station. You hear a heavy sigh exhale from her breath and she brings her attention to the customer you've abandoned.*\n\n**Hanako**: *(With a wry smile)* I'll get to your drink soon. Please wait a moment and I'll bring it to you.`,
        acceptable: `**Customer**: *(As they pick up the drink, they immediately ask)* Are you sure this is ${fateOrder.displayName.b}? There's something off about it...\n\n**You**: Uh... yeah. *(You anxiously reply, unsure yourself.)*`,
        incorrect: `*The customer appears and their eyes quickly oscillate between the cup and you.*\n\n**Customer**: Um... this isn't what I wanted.`,
        incorrectAgain: `*The customer appears and their eyes just stare at you.*\n\n**Customer**: Is this your first day?\n\n**Co-worker**: Oh, sorry about that. Yeah, they get really nervous behind the counter. This is for someone else. I'll go and make that drink for you.`,
        correct: `**Customer**: *(They stare at the drink for a moment and ask)* Is it this one?\n\n**You**: Yes. *(You nod in reply.)*\n\nThe customer happily grabs the drink and immediately starts sipping it.`
      },
      {
        name: 'Hakim',
        order: `**Customer**: Excuse me. I'll have ${fateOrder.displayName.b}, please.`,
        canceled: `*The patient customer comes back to the counter and asks the only staff member at the station...*\n\n**Customer**: Excuse me. How long until my drink is ready?\n\n***Hanako** looks around to find you nowhere immediately in sight. She nearly spills the fresh cup in her red, shaking hands. With a slight irritated brow, but still carrying a polite, professional tone and a bright smile...*\n\n**Hanako**: Your drink is coming soon. Please wait a little longer.`,
        acceptable: `**Customer**: Hm... *(The customer takes a sip and a sharp sigh exhales from their nose.)*`,
        incorrect: `*The customer takes a sip and disappointment washes over their face. Their perplexed eyes suddenly move towards yours.*\n\n**Customer**: I don't think this is what I ordered.`,
        incorrectAgain: `*The customer takes a sip and the same knitted brows appears over their eyes.*\n\n**Customer**: *heavily sighs* Excuse me, but this–.\n\n**Co-worker**: Oh, sorry about that. That was for that other customer there *(Points in a vague direction)*. We'll start on your drink now. (*To you*: I'll take it from here.)`,
        correct: `The customer takes a sip and seems pleased with the taste.\n\n**Customer**: Thank you.`
      },
      {
        name: 'Colin',
        order: `*A customer chattering to a phone on one ear approaches the counter. In the middle of their babbling...*\n\n**Customer**: Give me ${fateOrder.displayName.b}.`,
        canceled: `*You lock eyes with the customer and immediately turn around.*\n\n**Customer**: Excuse me! Where are you going?\n\n*How rude of you. The customer stormed out.*`,
        acceptable: `*While still blabbering to the phone, the customer saunters over to the counter, grabs the cup, and immediately leaves. A few moments later, you start to question your purpo-. You start to question if you made the right drink.*`,
        incorrect: `*While still blabbering to the phone, the customer saunters over to the counter, grabs the cup, and immediately leaves. A few minutes later, they reappear with a phone no longer attached to their head while waving a familiar cup in front of you.*\n\n**Customer**: Hey! This isn't what I ordered.`,
        incorrectAgain: `*They return to the counter and stare at the cup with confusion.*\n\n**Customer**: Is this supposed to be mine?\n\n**Co-worker**: Oh, no, this is for someone else. We're making your drink now. (*To you*: I'll make this one.)`,
        correct: `*You call the customer's name and they blissfully pick up their drink from the counter.*`,
      },
      {
        name: 'Yuri',
        order: `*A large customer walks through the door and examines the cafe before approaching the counter. You attempt to look up and meet their intimidating eyes as they tower over you.*\n\n**Customer**: Hm... I'll get ${fateOrder.displayName.b}.`,
        canceled: `*After hearing the order, you take a step back from the counter and slowly move towards the kitchen doors.*\n\n**Customer**: Hey, um...  Why are you walking away?\n\n*How rude of you. The customer stormed out.*`,
        acceptable: `*The customer takes a sip and immediately exhales a heavy sigh.*\n\n**Customer**: Something seems off about this...`,
        incorrect: `*As soon as you turn away, the customer calls.*\n\n**Customer**: Hey! This isn't what I wanted.`,
        incorrectAgain: `*You place the cup on the counter and attempt to speed walk to the back as the customer tries to call you.*\n\n**Customer**: Hey, wait! This is still wrong.\n\n*Before you reach the kitchen doors, your co-worker grabs your shirt and drags you to the front.*\n\n**You**: Oh, I think I called the wrong name. *(Your eyes bounce back and forth between the customer's glare and the nice stack of empty cups beside you. Then you feel a heavy weight force your head down.)* **You**: Sorry! We'll make your order right away!`,
        correct: `*The customer picks up the drink and immediately takes a sip. The corner of their lip seems to curl.*\n\n**Customer**: Thank you. *(They nod towards your direction)*`
      },
      {
        name: 'Kho',
        order: `*While still focused on the smaller menu on the counter...*\n\n**Customer**: Hello. I'll have the ${fateOrder.displayName.a}.`,
        canceled: `*As you return from the kitchen, the customer returns to the counter and curiously asks...*\n\n**Customer**: Hey, um...  Where is my drink?\n\n*Locked in place, you stare at them with a blank expression and even ignore to respond.*\n\n*How rude of you. The customer stormed out.*`,
        acceptable: `**Customer**: *(They stare at the drink for a moment and then ask)* Is this really the ${fateOrder.displayName.a}?\n\n**You**: Uh... yeah. *(You hesitantly reply, also not sure yourself.)*`,
        incorrect: `*The customer appears and their eyes quickly oscillate between the cup and you.*\n\n**Customer**: Excuse me. This isn't what I ordered.`,
        incorrectAgain: `*The customer appears and their deadpan eyes just stare at you.*\n\n**Customer**: Is this your first day?\n\n-# **Co-worker**: No, they're just an idiot.\n\nThe customer's attention followed the source of the mumbling.\n\n**Co-worker**: Yeah, they're just getting into it. I'll make that drink for you.`,
        correct: `*The customer stares at the drink for a moment before picking it up and taking a sip.*\n\n**Customer**: Thank you. *(They nod towards your direction)*`
      },
      {
        name: 'Philippe',
        order: `**Customer**: Hello. May I have ${fateOrder.displayName.b}, please?`,
        canceled: `*You heard the customer speak, but keep your attention on the more entertaining rubber mat on the floor.*\n\n**Customer**: Hey, um...  Are you listening to me?\n\n*You follow the intricate pattern etched in the plastic material and slowly walk away from the register.*\n\n*How rude of you. The customer stormed out.*`,
        acceptable: `*The customer takes a quick sip and immediately pulls the drink away from their lips.*\n\n**Customer**: Is this really ${fateOrder.displayName.b}? *(They ask gesturing the cup to you)*\n\n**You**: Um... yeah. *(You lied as easily as you breathed.)*`,
        incorrect: `*The customer takes a quick sip and immediately pulls the drink away from their lips while their glaring eyes try to find yours.*\n\n**Customer**: Excuse me. This isn't what I ordered.`,
        incorrectAgain: `*The customer hesitantly takes a sip and the same eyes meet yours.*\n\n**Customer**: *(Heavily sighs)* Hey–.\n\n**Co-worker**: Oh, sorry! That was for someone else. (*To you*: I'll take it from here.)`,
        correct: `*The customer takes a sip and a joyful smile washes over their face as they stare blissfully at the drink.*\n\n**Customer**: Thank you!`
      },
      {
        name: 'Fee',
        order: `*The customer approaches the counter with their arms crossed and brows already furrowed.*\n\n**Customer**: Hey. Let me have ${fateOrder.displayName.b} to-go.`,
        canceled: `*The customer returns to the counter and impatiently asks one of your co-workers...*\n\n**Customer**: Excuse me. Where's my drink?\n\n***Hanako**, your senior and the only barista on the floor replies with a forced smile...*\n\n**Hanako**: Please wait one moment.\n\n*While the customer reluctantly nods, **Hanako** immediately turns her head with her sharp, dagger eyes pointing at yours. She drops what she is doing and pulls you out from behind the kitchen doors.*\n\n**You**: Sorry! I'll get on that.\n\nYou suddenly apologize and get back to work.*`,
        acceptable: `*As soon as you turn away, the customer calls.*\n\n**Customer**: Excuse me! This doesn't taste right.\n\n**Customer**: Uh... it should be ${fateOrder.displayName.b}. *(You lied as quickly as you turned around.)*`,
        incorrect: `*As soon as you turn away, the customer calls.*\n\n**Customer**: Excuse me! This isn't the right order.`,
        incorrectAgain: `*You place the cup on the counter and attempt to speed walk away.*\n\n**Customer**: Hey, wait! This is still wrong!\n\n*Before you reach the kitchen doors, your co-worker pulls you back to the front.*\n\n**You**: I must have called the wrong name. *(You suddeenly feel a heavy weight force your head down.)* Sorry! We'll make your order right away!`,
        correct: `*You turn away half expecting the customer to call you over, but instead you just feel a cool wind rub against the back of your neck followed by a whiff of tobacco. You turn back around and find the customer and drink nowhere to be found.*`
      },
    ];

    const fateDialogue = Math.floor(Math.random() * customerDialogue.length);

    return customerDialogue[fateDialogue];
  }
}
