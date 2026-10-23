# Test day: the first real booking

For the day Stripe Connect works. Run it on **yardcard-elite.com** with your
own agency (`yardcard-elite`), in order: each part needs the one before it.
Tick boxes as you go, and note anything odd with the time it happened (that
makes it findable in the logs).

**This is real money.** Stripe is live. Each booking you pay and refund
costs a little: Stripe keeps its processing fee on refunds, and on a
turnkey (Express) account the platform keeps its $3. Expect to spend about
$10 to $15 for the whole run. Use your own card, and an email address of
yours as the customer.

## 0. Before you start (5 min)

- [ ] Signed in at yardcard-elite.com, on your agency's Home tab.
- [ ] **Settings > Booking page > Prices**: set the rental price low for the
      test (e.g. $25) and note the real one to put back after.
- [ ] **Signs**: at least the letters for a short name (e.g. TEST) and a
      few numbers are in stock.
- [ ] **Settings > Booking page > Hours and availability**: today isn't a
      day off, and the booking rules allow an event a few days out.
- [ ] Your email inbox and phone are handy.

## 1. Connect Stripe (10 to 20 min)

- [ ] **Settings > Payments**: connect Stripe and finish Stripe's own steps.
- [ ] Back in the app, Payments shows Stripe as connected and able to take
      payments (it can take a few minutes after Stripe's steps).
- [ ] Home's setup checklist shows payments done.
- [ ] Open your booking link (the link button in the top bar) in a private
      window: the booking page is **open**, not "not taking bookings".

## 2. Book like a customer (10 min)

In the private window, on your phone if you can:

- [ ] What and when: pick a message, type a name, then a date a few days
      out (days with your signs taken are grayed out), then the address.
- [ ] Design: pick a color for each line; each line drops into the yard
      and the signs are held on their own ("held for your dates").
- [ ] Your details: use a personal email you can check.
- [ ] Payment: the total matches your test price (plus any extra days).
      Pay with your real card.
- [ ] The confirmation page shows the order and its confirmation code.

Then check:

- [ ] **Customer email** ("Your booking with ..."): arrives, the yard
      picture shows, details are right, "Cancel your booking" link is there.
- [ ] **Agency email** ("New booking: ..."): arrives at your agency's email,
      "Open the order" goes to the order.
- [ ] **Orders** tab: the order is under Upcoming, total right.
- [ ] **Stripe dashboard** (your agency's account): the payment is there,
      for the same amount.

## 3. Customer cancels (5 min)

- [ ] From the customer email, open **Cancel your booking**.
- [ ] The page shows the refund your terms give (total minus the
      cancellation fee, or nothing inside the notice window). Write it down.
- [ ] Cancel. The page confirms.
- [ ] **Customer email** ("Booking cancelled"): says the same refund.
- [ ] **Agency email** ("Cancelled by the customer"): arrives.
- [ ] **Orders > Cancelled**: the order is there; its signs are free again.
- [ ] **Stripe**: a refund for exactly that amount on the payment.

Tip: with the default terms ($20 minimum fee) a $25 booking refunds $5.
That's correct, not a bug.

## 4. Agency cancels with a full refund (5 min)

- [ ] Book again as the customer (step 2, quicker this time).
- [ ] In the dashboard, open the order > **Cancel** > full refund.
- [ ] Customer gets "Booking cancelled" with the full amount; Stripe shows
      a full refund.

## 5. Out, back, and a damage fee (10 min, spread over a day or two)

- [ ] Book a third time, with an event day a few days out.
- [ ] Move it along: **Getting ready**, then **Out** (deployed).
- [ ] After the pickup day, **Check in** the signs and mark one sign
      **damaged**.
- [ ] The fees screen offers the damage fee from your terms. Charge it.
- [ ] Customer gets "Fees for your booking" with the right amounts; Stripe
      shows the charge on the saved card.

Late fees work the same way, but need the check-in to happen after the
scheduled pickup day; skip them unless the timing lands naturally.

## 6. Put things back (2 min)

- [ ] Settings > Prices: back to your real price.
- [ ] Cancel or complete any test orders still open.

## If something goes wrong

Note the step, what you expected, what happened, and the time. Don't retry
a payment step more than once: a second try can mean a second charge.
Bring the notes back to a Claude session; Vercel's logs and Stripe's event
history for that time usually show the cause.
