# Vent Runner leaderboard: page copy (DRAFT: have this checked before launch)

Decisions made: UK delivery addresses only; monthly leaderboards kept for 24 months.

---

## Page 1: /games/leaderboard-terms/ — "Vent Runner leaderboard rules"

**Who runs it.** The Vent Runner leaderboard is run by The Metavision Multimedia Limited (company number 16282479), 167-169 Great Portland Street, London, trading as Labrats ("we").

**Free to play, no purchase needed.** Every run of Vent Runner played on labrats.uk is entered automatically under the player's racing name. Nobody has to buy anything or sign up to take part.

**Young players.** Players under 18 need a parent or guardian's permission to take part. Only a parent or guardian aged 18 or over can claim a prize.

**How the winner is decided.** Each month is a separate competition, running from the 1st to the last day of the calendar month, UK time, and starting from an empty leaderboard. Runs from earlier months don't count. The winner is the player with the furthest distance in a single run that month, as recorded by our leaderboard. If two runs are equal, the earlier one wins. Each device's best run counts once.

**The prize.** One Labrats t-shirt each month, in a size chosen when the prize is claimed. There's no cash alternative. If that t-shirt isn't available, we may send a Labrats item of equal or higher value instead.

**Claiming.** The winner sees a "You won!" message with a prize code the next time they open Vent Runner on the device they played on. A parent or guardian claims the prize at labrats.uk/games/claim/ using that code within 30 days of the end of the month. Prizes can only be sent to UK addresses. Prizes not claimed in time lapse. We post prizes within 28 days of a valid claim.

**Fair play.** Runs are checked automatically. We review the winning run before sending the prize and may disqualify any entry we reasonably believe involved cheating, automation, or tampering with the game. If the winner is disqualified or the prize isn't claimed, we may offer it to the next eligible player.

**Racing names.** Players don't type their own names: the game creates a random racing name (for example "SneakyCheddar42"), which can be changed with the New name button. We may show the winning racing name and distance on our website and social media. We never publish real names.

**Changes.** We may change or end the leaderboard by updating this page. Prizes already won will still be honoured.

**Questions.** Email contact@labrats.uk.

---

## Addition to the Labrats privacy policy — "Games and the Vent Runner leaderboard"

You don't need to give us any personal information to play our games.

When a run of Vent Runner ends, the game sends us the distance, score, stage and runner, together with a randomly created racing name and a random code stored on your device. We use the device code only to recognise the winning device and show it the prize message. We don't use it to track anyone, and it isn't linked to any personal information. We keep each month's leaderboard for 24 months, then delete it. We keep a record of each month's winning racing name and distance as our prize history.

If a player wins, their parent or guardian gives us their name, email address and delivery address to claim the prize. We use these only to send the prize and to contact them about it. We don't add them to any mailing list unless they separately ask to join one, and we delete them once the prize has been sent (and within 90 days at most).

Our lawful basis for running the leaderboard is our legitimate interest in running a fair game. For prize claims it is to send the prize the parent or guardian has asked for. To ask about or delete leaderboard data, email contact@labrats.uk.

---

## Page 2: /games/claim/ — "Claim a Vent Runner prize"

Intro: *Congratulations to your Vent Runner champion! Fill in this form to claim their Labrats t-shirt. You'll need the prize code shown in the game.*

Fields (all required unless marked):

| Label | Field | Notes |
|---|---|---|
| Prize code | `claimCode` | 8 characters; prefill from `?code=` |
| Month won | `month` | hidden, from `?month=` (YYYY-MM); if missing, show a month picker for the last 2 months |
| Your name (parent or guardian) | `guardianName` | max 80 |
| Your email | `email` | for the receipt and delivery updates |
| Address line 1 | `address1` | |
| Address line 2 (optional) | `address2` | |
| Town or city | `town` | |
| Postcode | `postcode` | UK postcodes only; add a line under the field: "Prizes can only be sent to UK addresses." |
| T-shirt size | `size` | exactly these options: Kids 3-4, Kids 5-6, Kids 7-8, Kids 9-11, Kids 12-14, Adult S, Adult M, Adult L, Adult XL |
| Consent (checkbox) | `consent` | "I'm the winner's parent or guardian, I'm 18 or over, and I agree to the leaderboard rules." with a link to the rules and the privacy policy |

Button: **Claim prize**

On success: *Thanks! We've emailed you a receipt. We'll check the winning run and post the t-shirt within 28 days.*

Error messages (from the `reason` the server returns):
- `code`: *That prize code doesn't match this month's winner. Check the code shown in the game.*
- `claimed`: *This prize has already been claimed. Questions? Email contact@labrats.uk.*
- `form`: *Please fill in every field and tick the box to confirm you're the winner's parent or guardian.*
- anything else: *Something went wrong sending your claim. Please try again, or email contact@labrats.uk.*
