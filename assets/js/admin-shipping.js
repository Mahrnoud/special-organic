/* City shipping rates share the dashboard's authenticated request helpers. */
let osAdminShipping = [];
let osShippingBusy = false;

function renderAdminShipping() {
  const select = document.getElementById('shippingCity');
  const selected = select.value;
  select.innerHTML = osAdminShipping.map((city) =>
    `<option value="${osEscape(city.en)}">${osEscape(osLang() === 'ar' ? city.ar : city.en)}</option>`).join('');
  if (osAdminShipping.some((city) => city.en === selected)) select.value = selected;
  fillShippingFee();
  document.getElementById('shippingTableBody').innerHTML = osAdminShipping.map((city) =>
    `<tr><td>${osEscape(osLang() === 'ar' ? city.ar : city.en)}</td><td>${osFormatPrice(city.fee)}</td></tr>`).join('');
}

function fillShippingFee() {
  const city = osAdminShipping.find((entry) => entry.en === document.getElementById('shippingCity').value);
  document.getElementById('shippingFee').value = city?.fee ?? '';
}

function setShippingBusy(busy) {
  osShippingBusy = busy;
  document.getElementById('shippingFields').disabled = busy || !osAdminShipping.length;
  document.getElementById('refreshShipping').disabled = busy;
}

async function loadShipping() {
  if (osShippingBusy) return;
  setShippingBusy(true);
  const status = document.getElementById('shippingListStatus');
  status.textContent = osT('loading');
  try {
    const data = await osAdminRequest('api/get_shipping.php', { cache: 'no-store' });
    osAdminShipping = data.rates;
    renderAdminShipping();
    status.textContent = '';
  } catch (error) {
    osAdminShipping = [];
    document.getElementById('shippingTableBody').innerHTML = '';
    status.textContent = error.message || osT('request_error');
  } finally { setShippingBusy(false); }
}

document.getElementById('shippingCity').addEventListener('change', fillShippingFee);
document.getElementById('refreshShipping').addEventListener('click', loadShipping);
document.getElementById('shippingForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (osShippingBusy || !event.currentTarget.reportValidity()) return;
  const city = document.getElementById('shippingCity').value;
  const fee = Number(document.getElementById('shippingFee').value);
  setShippingBusy(true);
  const button = document.getElementById('saveShippingBtn');
  button.textContent = osT('saving');
  try {
    const data = await osAdminRequest('api/save_shipping.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, fee }),
    });
    osAdminShipping = data.rates;
    renderAdminShipping();
    osAdminNotice(osT('shipping_saved'));
  } catch (error) { osAdminNotice(error.message || osT('request_error'), true); }
  finally {
    setShippingBusy(false);
    button.textContent = osT('save_shipping');
  }
});
