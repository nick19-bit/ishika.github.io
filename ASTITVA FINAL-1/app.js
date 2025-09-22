// CART LOGIC
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    document.querySelectorAll("#cartCount").forEach((el) => (el.textContent = count));
}

function addToCart(name, price) {
    const existing = cart.find((i) => i.name === name);
    if (existing) existing.qty++;
    else cart.push({ name, price, qty: 1 });
    saveCart();
    // Replaced alert with custom popup
    showPopup('Item Added', name + " added to cart!");
    renderCart();
}

function changeQty(name, delta) {
    const item = cart.find((i) => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((i) => i.name !== name);
    saveCart();
    renderCart();
}

function removeItem(name) {
    cart = cart.filter((i) => i.name !== name);
    saveCart();
    renderCart();
}

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

function renderCart() {
    const container = document.getElementById("cartItems");
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        document.getElementById("cartTotals").innerHTML = "";
        return;
    }
    let html = "<table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>";
    cart.forEach((item) => {
        html += `<tr><td>${item.name}</td>
            <td><button onclick="changeQty('${item.name}',-1)">-</button> ${item.qty} <button onclick="changeQty('${item.name}',1)">+</button></td>
            <td>Rs.${item.price}</td><td>Rs.${item.price * item.qty}</td>
            <td><button onclick="removeItem('${item.name}')">Remove</button></td></tr>`;
    });
    html += "</table>";
    container.innerHTML = html;

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * 0.05;
    const delivery = subtotal > 500 ? 0 : 40;
    const total = subtotal + tax + delivery;
    document.getElementById("cartTotals").innerHTML = `
        <p>Subtotal: Rs.${subtotal}</p>
        <p>Tax (5%): Rs.${tax.toFixed(2)}</p>
        <p>Delivery Fee: Rs.${delivery}</p>
        <h3>Total: Rs.${total.toFixed(2)}</h3>`;
    
    updatePaymentSummary();
}

// PAYMENT LOGIC
function updatePaymentSummary() {
    const container = document.getElementById("paymentSummary");
    if (!container) return;

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * 0.05;
    const delivery = subtotal > 500 ? 0 : 40;
    const total = subtotal + tax + delivery;

    let methodText = "Not selected";
    const method = document.querySelector('input[name="method"]:checked')?.value;

    if (method === "card") {
        const number = document.querySelector('#cardFields input[placeholder="Card Number"]').value.trim();
        const last4 = number ? number.slice(-4) : "XXXX";
        methodText = "Card ending in " + last4;
    } else if (method === "upi") {
        methodText = "UPI";
    } else if (method === "cash") {
        methodText = "Cash";
    }

    container.innerHTML = `
        <h4>Payment Summary</h4>
        <p>Subtotal: Rs.${subtotal}</p>
        <p>Tax: Rs.${tax.toFixed(2)}</p>
        <p>Delivery: Rs.${delivery}</p>
        <p><strong>Total: Rs.${total.toFixed(2)}</strong></p>
        <p>Method: ${methodText}</p>
    `;
}

// A generic function to show a custom popup
function showPopup(title, message) {
    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';
    popupContainer.innerHTML = `
      <div class="popup-content">
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(popupContainer);

    // Remove the pop-up after a short delay
    setTimeout(() => {
        popupContainer.remove();
    }, 2000); // 2-second pop-up display
}

// Function to transition to the final receipt screen
function showFinalReceipt() {
    const receiptDiv = document.getElementById("receipt");
    if (!receiptDiv) return;
    
    // Generate a random order ID and a total
    const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
    const totalAmount = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = totalAmount * 0.05;
    const delivery = totalAmount > 500 ? 0 : 40;
    const finalTotal = totalAmount + tax + delivery;

    const selectedMethod = document.querySelector('input[name="method"]:checked').value;

    // Populate the receipt details
    receiptDiv.innerHTML = `
        <h3>Order Receipt</h3>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Payment Method:</strong> ${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}</p>
        <p><strong>Total Amount:</strong> Rs.${finalTotal.toFixed(2)}</p>
    `;

    // Clear the cart
    clearCart();

    // Show the success section and hide the payment form
    const paymentSection = document.getElementById('paymentSection');
    const successSection = document.getElementById('successSection');
    if (paymentSection) paymentSection.classList.add('hidden');
    if (successSection) successSection.classList.remove('hidden');
}


// DOMContentLoaded setup
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    renderCart();

    const radios = document.querySelectorAll('input[name="method"]');
    const cardFields = document.getElementById("cardFields");
    const upiBox = document.getElementById("upiBox");
    const payButton = document.querySelector('#paymentForm button[type="submit"]');
    const upiTimerDisplay = document.getElementById('upiTimer');
    
    let upiTimer = null;
    const upiTimeoutDuration = 30; // 30 seconds for the timer

    // Function to start the UPI timer
    const startUpiTimer = () => {
        let timeLeft = upiTimeoutDuration;
        upiTimerDisplay.textContent = `Time remaining: ${timeLeft} seconds`;
        
        payButton.disabled = true;

        upiTimer = setInterval(() => {
            timeLeft--;
            upiTimerDisplay.textContent = `Time remaining: ${timeLeft} seconds`;
            if (timeLeft <= 0) {
                clearInterval(upiTimer);
                showPopup('Payment Received!', 'Your transaction has been processed successfully.');
                setTimeout(showFinalReceipt, 2000); // Wait for pop-up to finish
            }
        }, 1000);
    };

    radios.forEach((r) =>
        r.addEventListener("change", (e) => {
            const method = e.target.value;
            cardFields?.classList.add("hidden");
            upiBox?.classList.add("hidden");
            payButton.disabled = false;
            
            // Stop any running timer
            if (upiTimer) {
                clearInterval(upiTimer);
            }

            if (method === "card") {
                cardFields?.classList.remove("hidden");
            } else if (method === "upi") {
                upiBox?.classList.remove("hidden");
                payButton.disabled = true; // Button disabled as UPI is handled by timer
                startUpiTimer();
            }
            updatePaymentSummary();
        })
    );
    
    const form = document.getElementById("paymentForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const method = document.querySelector('input[name="method"]:checked')?.value;
            
            if (!method) {
                showPopup("Error", "Please select a payment method.");
                return;
            }
            
            if (method === "card") {
                showPopup('Payment Received!', 'Your transaction has been processed successfully.');
                setTimeout(showFinalReceipt, 2000);
            } else if (method === "cash") {
                showPopup('Order Received!', 'Enjoy your food!');
                setTimeout(showFinalReceipt, 2000);
            }
        });
    }

    if (cardFields) cardFields.addEventListener("input", updatePaymentSummary);
});

// GALLERY LIGHTBOX
document.addEventListener("DOMContentLoaded", () => {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    const lightboxImg = lightbox.querySelector("img");
    document.querySelectorAll(".gallery img").forEach((img) => {
        img.addEventListener("click", () => {
            lightboxImg.src = img.src;
            lightbox.classList.add("show");
        });
    });
    lightbox.addEventListener("click", () => {
        lightbox.classList.remove("show");
    });
});

// BOOKING FORM
document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById("bookingForm");
    const bookingList = document.getElementById("bookingList");
    function loadBookings() {
        if (!bookingList) return;
        bookingList.innerHTML = "";
        const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
        bookings.forEach((b) => {
            const li = document.createElement("li");
            li.textContent = `${b.date} ${b.time} | ${b.name} | Guests: ${b.guests} | Booking ID: ${b.id}`;
            bookingList.appendChild(li);
        });
    }

    if (bookingForm) {
        bookingForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("name").value;
            const phone = document.getElementById("phone").value;
            const date = document.getElementById("date").value;
            const time = document.getElementById("time").value;
            const guests = document.getElementById("guests").value;
            const bookingId = Math.floor(100000 + Math.random() * 900000);
            const booking = { id: bookingId, name, phone, date, time, guests };
            let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
            bookings.push(booking);
            localStorage.setItem("bookings", JSON.stringify(bookings));
            showPopup("Table Booked!", "Table booked! Booking ID: " + bookingId);
            bookingForm.reset();
            loadBookings();
        });
    }
    loadBookings();
});

// DELIVERY FORM
document.addEventListener("DOMContentLoaded", () => {
    const deliveryForm = document.getElementById("deliveryForm");
    if (deliveryForm) {
        deliveryForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const orderNo = Math.random().toString(36).substring(2, 8).toUpperCase();
            showPopup("Order Received!", "Order received! Order No: " + orderNo);
            deliveryForm.reset();
        });
    }
});

// FEEDBACK FORM
document.addEventListener("DOMContentLoaded", () => {
    const feedbackForm = document.getElementById("feedbackForm");
    if (feedbackForm) {
        feedbackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            showPopup("Thank You!", "Thank you for your feedback!");
            feedbackForm.reset();
        });
    }
});

// CONTACT FORM
document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            showPopup("Message Sent!", "Your message has been sent!");
            contactForm.reset();
        });
    }
});                                                                                                                                          