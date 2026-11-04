# Vent Runner leaderboard: page copy (DRAFT: have this checked before launch)

Decisions made: delivery to England, Scotland, Wales and Northern Ireland only (no Channel Islands, Isle of Man or BFPO); monthly leaderboards kept for 24 months; the prize is claimed by the winner if 18 or over, or by their parent or guardian; the winner chooses any Labrats T-shirt design (adult, or kids where the design has kids variants); 30 days to claim for the winner, then 14 days for each next player, down the top 10.

Status (feat/vr-prize-flow): pages 1 and 2 are in the code on the branch, not published. The privacy-policy addition lives in Sanity and has NOT been changed: publish it there before (or with) the branch going live.

---

## Page 1: /games/leaderboard-terms/ — "Vent Runner leaderboard rules"

**Who runs it.** The Vent Runner leaderboard is run by The Metavision Multimedia Limited (company number 16282479), 167-169 Great Portland Street, London, trading as Labrats ("we").

**Free to play, no purchase needed.** Every run of Vent Runner played on labrats.uk is entered automatically under the player's racing name. Nobody has to buy anything or sign up to take part.

**Young players.** Players under 18 need a parent or guardian's permission to take part. A prize is claimed by the winner, or by their parent or guardian if the winner is under 18. Whoever claims must be 18 or over.

**How the winner is decided.** Each month is a separate competition, running from the 1st to the last day of the calendar month, UK time, and starting from an empty leaderboard. Runs from earlier months don't count. The winner is the player with the furthest distance in a single run that month, as recorded by our leaderboard. If two runs are equal, the earlier one wins. Each device's best run counts once.

**The prize.** One Labrats T-shirt each month. Whoever claims it chooses any Labrats T-shirt design from our shop, as an adult T-shirt or, for designs that come in kids' sizes, a kids T-shirt, then a colour and size from those that design comes in. There's no cash alternative. If the chosen T-shirt can't be made, we'll ask for another choice, or may send a Labrats item of equal or higher value instead.

**Claiming.** The winner sees a "You won!" message with a prize code the next time they open Vent Runner on the device they played on. The winner, or their parent or guardian if they're under 18, claims the prize at labrats.uk/games/claim/ using that code within 30 days of the end of the month. Prizes can only be posted to addresses in England, Scotland, Wales and Northern Ireland: we can't post them to the Channel Islands, the Isle of Man or BFPO addresses. We post prizes within 28 days of a valid claim.

**If the winner can't claim.** If the winner can't give an address in England, Scotland, Wales or Northern Ireland, doesn't claim within 30 days of the end of the month, or is disqualified, the prize passes to the next-highest eligible player on that month's leaderboard. They see a "You won!" message with a new prize code the next time they open Vent Runner on the device they played on, and have 14 days to claim. If they can't claim either, it passes on again in the same way, down the top 10 of that month's leaderboard. If none of the top 10 claims it, the prize lapses.

**Fair play.** Runs are checked automatically. We review the winning run before sending the prize and may disqualify any entry we reasonably believe involved cheating, automation, or tampering with the game, including after a prize has been claimed.

**Racing names.** Players don't type their own names: the game creates a random racing name (for example "SneakyCheddar42"), which can be changed with the New name button. We may show the winning racing name and distance on our website and social media. We never publish real names.

**Changes.** We may change or end the leaderboard by updating this page. Prizes already won will still be honoured.

**Questions.** Email contact@labrats.uk.

---

## Addition to the Labrats privacy policy — "Games and the Vent Runner leaderboard" (DRAFT, replaces the earlier draft)

You don't need to give us any personal information to play our games.

When a run of Vent Runner ends, the game sends us the distance, score, stage and runner, together with a randomly created racing name and a random code stored on your device. We use the device code only to recognise a device that has won a prize, including one that passes down to it, and show it the prize message. We don't use it to track anyone, and it isn't linked to any personal information. We keep each month's leaderboard for 24 months, then delete it. We keep a record of each month's top 10 racing names and distances, so that a prize can pass down the list, and of who won, as our prize history. These records contain no personal information.

To claim a prize, the winner (if they're 18 or over) or their parent or guardian gives us their name, email address and delivery address, says which of the two they are, and chooses the T-shirt. We use these details only to send the prize and to contact them about it. To make and post the T-shirt, we pass the name and delivery address (not the email address) to our printing partner, Printful, who uses them only for that order and keeps its order records under its own privacy policy. We don't add claimants to any mailing list or send them offers, referral codes or marketing unless they separately ask to join our newsletter, and we delete our copy of their details once the prize has been sent (and within 90 days at most). If a prize passes to the next player, we don't share anything about the earlier winner with them.

Our lawful basis for running the leaderboard is our legitimate interest in running a fair game. For prize claims it is to send the prize the claimant has asked for. To ask about or delete leaderboard data, email contact@labrats.uk.

---

## Page 2: /games/claim/ — "Claim a Vent Runner prize"

Intro: *Congratulations! Fill in this form to claim the Labrats T-shirt won on the Vent Runner leaderboard. The prize is claimed by the winner, or their parent or guardian if they're under 18. You'll need the prize code shown in the game.*

Fields (all required unless marked):

| Label | Field | Notes |
|---|---|---|
| Prize code | `claimCode` | 8 characters; prefill from `?code=` |
| Month won | `month` | hidden, from `?month=` (YYYY-MM); if missing, a picker for the last 6 months |
| Who's claiming? (radio) | `claimant` | "I'm the winner and I'm 18 or over" (`winner`) / "I'm the winner's parent or guardian" (`guardian`) |
| Choose the T-shirt | `design`, `garment`, `colour`, `size` | Note: "Any Labrats T-shirt design from our shop, in the colours and sizes that design comes in." Design, then T-shirt (Adult T-shirt / Kids T-shirt, only those the design has), then colour, then size: all from the design's real Printful variants (`/api/vr-prize-options`), with the colour's picture |
| Your name | `name` | max 80 |
| Your email | `email` | for the receipt |
| Address line 1 | `address1` | |
| Address line 2 (optional) | `address2` | |
| Town or city | `town` | |
| Postcode | `postcode` | Note: "Prizes can only be posted to England, Scotland, Wales and Northern Ireland. We can't use Channel Islands, Isle of Man or BFPO addresses." |
| Country | (fixed text) | United Kingdom |
| Consent (checkbox) | `consent` | "What I've ticked above is true, and I agree to the leaderboard rules. See our privacy policy." |

Button: **Claim prize**

On success: *Thanks! We've emailed you a receipt. We'll check the winning run and post the T-shirt within 28 days.*

Below the form, "Can't use a UK address?": *We can only post prizes to England, Scotland, Wales and Northern Ireland. If you can't give an address there, you can pass the prize to the next player on the leaderboard. Enter the prize code above first. This can't be undone.* Button **Pass the prize on**, then *Pass the prize to the next player?* **Yes, pass it on** / **No, go back**. On success: *Thanks for letting us know. The prize has passed to the next player.*

Error messages (from the `reason` the server returns):
- `code`: *That prize code doesn't match a prize waiting to be claimed. Check the code and month shown in the game.*
- `claimed`: *This prize has already been claimed. Questions? Email contact@labrats.uk.*
- `expired`: *The time to claim this prize has run out, so it has passed to the next player. Questions? Email contact@labrats.uk.*
- `busy`: *This prize is being claimed right now. Please wait a couple of minutes and try again.*
- `form`: *Please fill in every field, choose who's claiming and the T-shirt, and tick the box.*
- `prize`: *That T-shirt isn't available any more. Please choose another colour or size.*
- `postcode-crown`: *We can only post prizes to England, Scotland, Wales and Northern Ireland, so Channel Islands (GY, JE) and Isle of Man (IM) addresses can't be used.*
- `postcode-bfpo`: *We can't post prizes to BFPO addresses. Please give an address in England, Scotland, Wales or Northern Ireland.*
- `postcode-format`: *That doesn't look like a UK postcode. Prizes can only be posted to England, Scotland, Wales and Northern Ireland.*
- designs didn't load: *We couldn't load the T-shirt designs. Please refresh the page, or email contact@labrats.uk.*
- anything else (including `email`): *Something went wrong sending your claim. Please try again, or email contact@labrats.uk.*

---

## In the game

- Title screen note: *The furthest run each month wins a Labrats T-shirt. Winners under 18 need a parent or guardian to claim it.*
- "You won!" screen: *{nick}, your {distance} m run was the furthest in {month}!* or, when it passed down, *{nick}, the {month} prize has passed to you: your {distance} m run is next in line!*, then *Claim your Labrats T-shirt with this code by {date}. If you're under 18, ask a parent or guardian to claim it for you. Prizes can only be posted to UK addresses.* Button: **Claim the prize**.
