/* Shared size catalog; product prices are managed separately. */
let osAdminSizes = [];
let osEditingSize = null;
let osSizesBusy = false;
let osSizesRequest = 0;
async function loadSizes() {
  const request = ++osSizesRequest;
  const status = document.getElementById('sizesStatus');
  status.textContent = osT('loading');
  try {
    const data = await osAdminRequest('api/get_sizes.php', { cache: 'no-store' });
    if (request !== osSizesRequest) return;
    osAdminSizes = data.sizes;
    renderSizes();
    status.textContent = '';
  } catch (error) {
    if (request === osSizesRequest) status.textContent = error.message || osT('request_error');
    throw error;
  }
}
function renderSizes() {
  document.getElementById('sizesTableBody').innerHTML = osAdminSizes.map(size => `<tr>
    <td dir="ltr">${osEscape(size.label_en)}</td><td dir="rtl">${osEscape(size.label_ar)}</td>
    <td>${osT(size.archived ? 'archived' : 'active')}</td><td><div class="d-flex gap-2">
    <button type="button" class="btn btn-sm btn-outline-forest" data-edit-size="${size.id}">${osT('edit')}</button>
    <button type="button" class="btn btn-sm btn-outline-secondary" data-archive-size="${size.id}">${osT(size.archived ? 'restore_size' : 'archive_size')}</button></div></td></tr>`).join('');
}
function resetSizeForm() {
  osEditingSize = null;
  document.getElementById('sizeForm').reset();
  document.getElementById('cancelSizeEdit').hidden = true;
}
document.getElementById('cancelSizeEdit').onclick = resetSizeForm;
document.getElementById('refreshSizes').onclick = () => loadSizes().catch(() => {});
document.getElementById('sizesTableBody').onclick = async event => {
  const button = event.target.closest('button');
  if (!button || osSizesBusy) return;
  const size = osAdminSizes.find(s => s.id === Number(button.dataset.editSize || button.dataset.archiveSize));
  if (!size) return;
  if (button.dataset.editSize) {
    osEditingSize = size.id;
    document.getElementById('sizeLabelEn').value = size.label_en;
    document.getElementById('sizeLabelAr').value = size.label_ar;
    document.getElementById('cancelSizeEdit').hidden = false;
    document.getElementById('sizeLabelEn').focus();
    return;
  }
  osSizesBusy = true;
  button.disabled = true;
  try {
    await osAdminRequest('api/archive_size.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: size.id, archived: !size.archived }) });
    osAdminNotice(osT(size.archived ? 'size_restored' : 'size_archived'));
    await loadSizes();
  } catch (error) { osAdminNotice(error.message || osT('request_error'), true); }
  finally { osSizesBusy = false; button.disabled = false; }
};
document.getElementById('sizeForm').onsubmit = async event => {
  event.preventDefault();
  if (osSizesBusy) return;
  osSizesBusy = true;
  document.getElementById('sizeFields').disabled = true;
  try {
    await osAdminRequest('api/save_size.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      id: osEditingSize, label_en: document.getElementById('sizeLabelEn').value.trim(), label_ar: document.getElementById('sizeLabelAr').value.trim()
    }) });
    resetSizeForm();
    osAdminNotice(osT('size_saved'));
    await loadSizes();
    await loadProducts();
  } catch (error) { osAdminNotice(error.message || osT('request_error'), true); }
  finally { osSizesBusy = false; document.getElementById('sizeFields').disabled = false; }
};
