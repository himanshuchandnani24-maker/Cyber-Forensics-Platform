// File: static/js/search.js
// Global search and filtering functionality for Cyber Forensics Platform

(function(){
  const STORAGE_KEY = 'cyberforensics_search_history';
  const DEBOUNCE_DELAY = 300;
  let debounceTimer = null;
  
  // Initialize search functionality
  window.initSearch = function(){
    const searchInput = document.getElementById('globalSearchInput');
    const searchBtn = document.getElementById('globalSearchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if(!searchInput) return;
    
    // Global search on input (debounced)
    searchInput.addEventListener('input', (e)=>{
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(()=>{
        performGlobalSearch(e.target.value);
      }, DEBOUNCE_DELAY);
    });
    
    // Search button click
    if(searchBtn){
      searchBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        performGlobalSearch(searchInput.value);
      });
    }
    
    // Clear search
    if(clearSearchBtn){
      clearSearchBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        searchInput.value = '';
        clearAllFilters();
        searchInput.focus();
      });
    }
    
    // Keyboard shortcut Ctrl+F
    document.addEventListener('keydown', (e)=>{
      if((e.ctrlKey || e.metaKey) && e.key === 'f'){
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
    
    // Load and display search history
    updateSearchHistorySuggestions();
  };
  
  // Perform global search across all visible tables
  function performGlobalSearch(query){
    const trimmed = query.trim();
    
    // Save to history
    if(trimmed.length > 0){
      saveSearchHistory(trimmed);
      updateSearchHistorySuggestions();
    }
    
    // Filter all available tables
    filterTable('ipTableBody', trimmed, null);
    filterTable('timelineBody', trimmed, null);
    filterAuthEvents(trimmed);
    filterThreats(trimmed);
    
    // Update UI
    updateSearchIndicator(trimmed);
  }
  
  // Filter table rows by query
  window.filterTable = function(tableBodyId, query, columnIndex){
    const tbody = document.getElementById(tableBodyId);
    if(!tbody) return;
    
    const query_lower = query.toLowerCase();
    let visibleCount = 0;
    let totalCount = 0;
    
    // Get all rows except "no data" placeholder
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
      if(row.classList.contains('no-data-row')){
        return; // Skip placeholder row
      }
      
      totalCount++;
      let match = false;
      
      if(!query_lower){
        // No query: show all
        match = true;
      } else if(columnIndex !== null && columnIndex !== undefined){
        // Search specific column
        const cell = row.cells[columnIndex];
        if(cell){
          match = cell.textContent.toLowerCase().includes(query_lower);
        }
      } else {
        // Search all columns
        const cells = row.querySelectorAll('td');
        match = Array.from(cells).some(cell => 
          cell.textContent.toLowerCase().includes(query_lower)
        );
      }
      
      if(match){
        row.style.display = '';
        highlightMatches(row, query_lower);
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    
    // Show "no results" message if needed
    if(visibleCount === 0 && query_lower){
      const noResultsRow = document.createElement('tr');
      noResultsRow.className = 'no-data-row text-muted text-center';
      noResultsRow.innerHTML = `<td colspan="99" class="py-3 font-monospace text-sm">No results for "${query}"</td>`;
      tbody.appendChild(noResultsRow);
    } else {
      // Remove any existing "no results" rows
      tbody.querySelectorAll('.no-data-row').forEach(row => row.remove());
    }
    
    // Update filter count
    updateFilterCount(tableBodyId, visibleCount, totalCount, query);
  };
  
  // Filter authentication events list
  function filterAuthEvents(query){
    const ul = document.getElementById('authEventsList');
    if(!ul) return;
    
    const query_lower = query.toLowerCase();
    const items = ul.querySelectorAll('li:not(.auth-no-results)');
    let visibleCount = 0;
    
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if(!query_lower || text.includes(query_lower)){
        item.style.display = '';
        if(query_lower) highlightMatches(item, query_lower);
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });
    
    // Show "no results" message if needed
    if(visibleCount === 0 && query_lower){
      const noResult = document.createElement('li');
      noResult.className = 'list-group-item bg-dark text-muted font-monospace text-sm auth-no-results';
      noResult.textContent = `No authentication events match "${query}"`;
      ul.appendChild(noResult);
    } else {
      ul.querySelectorAll('.auth-no-results').forEach(item => item.remove());
    }
  }
  
  // Filter threats
  function filterThreats(query){
    const container = document.getElementById('threatList');
    if(!container) return;
    
    const query_lower = query.toLowerCase();
    const threats = container.querySelectorAll('.col-md-4, .col-sm-6, .col-12');
    let visibleCount = 0;
    
    threats.forEach(threat => {
      const text = threat.textContent.toLowerCase();
      if(!query_lower || text.includes(query_lower)){
        threat.style.display = '';
        if(query_lower) highlightMatches(threat, query_lower);
        visibleCount++;
      } else {
        threat.style.display = 'none';
      }
    });
    
    // Show "no results" message if needed
    if(visibleCount === 0 && query_lower){
      container.innerHTML = `<div class="col-12 text-muted font-monospace text-sm"><i class="fa-solid fa-shield me-1"></i>No threats match "${query}"</div>`;
    }
  }
  
  // Highlight matching text in elements
  window.highlightMatches = function(element, query){
    if(!query) return;
    
    const query_lower = query.toLowerCase();
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const nodesToReplace = [];
    let node;
    while(node = walker.nextNode()){
      const text = node.textContent;
      if(text.toLowerCase().includes(query_lower)){
        nodesToReplace.push(node);
      }
    }
    
    nodesToReplace.forEach(textNode => {
      const span = document.createElement('span');
      const text = textNode.textContent;
      const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      
      parts.forEach(part => {
        if(part.toLowerCase() === query_lower){
          const mark = document.createElement('mark');
          mark.className = 'search-highlight';
          mark.textContent = part;
          span.appendChild(mark);
        } else {
          span.appendChild(document.createTextNode(part));
        }
      });
      
      textNode.parentNode.replaceChild(span, textNode);
    });
  };
  
  // Remove highlights from element
  function removeHighlights(element){
    const marks = element.querySelectorAll('mark.search-highlight');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      while(mark.firstChild){
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    });
  }
  
  // Clear all filters
  function clearAllFilters(){
    document.querySelectorAll('table tbody tr').forEach(row => {
      row.style.display = '';
      removeHighlights(row);
    });
    document.querySelectorAll('.no-data-row').forEach(row => row.remove());
    document.querySelectorAll('.auth-no-results').forEach(row => row.remove());
    updateSearchIndicator('');
  }
  
  // Update search indicator showing active filter
  function updateSearchIndicator(query){
    const indicator = document.getElementById('searchIndicator');
    if(!indicator) return;
    
    if(query.trim()){
      indicator.style.display = '';
      const badge = indicator.querySelector('.badge');
      if(badge) badge.textContent = `Search: "${query}"`;
    } else {
      indicator.style.display = 'none';
    }
  }
  
  // Update filter count display
  function updateFilterCount(tableBodyId, visible, total, query){
    // This can be extended to show counts per table if needed
    const countElement = document.getElementById(`${tableBodyId}-count`);
    if(countElement && query.trim()){
      countElement.textContent = `${visible}/${total}`;
    }
  }
  
  // Save search query to localStorage
  function saveSearchHistory(query){
    let history = getSearchHistory();
    // Remove if already exists (to put it at the top)
    history = history.filter(q => q !== query);
    // Add to top
    history.unshift(query);
    // Keep only last 10
    history = history.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
  
  // Get search history from localStorage
  function getSearchHistory(){
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  }
  
  // Update search history suggestions
  function updateSearchHistorySuggestions(){
    const suggestionsList = document.getElementById('searchSuggestions');
    if(!suggestionsList) return;
    
    const history = getSearchHistory();
    suggestionsList.innerHTML = '';
    
    if(history.length === 0){
      suggestionsList.innerHTML = '<li class="dropdown-item text-muted font-monospace text-sm disabled">No search history</li>';
      return;
    }
    
    history.forEach(query => {
      const li = document.createElement('li');
      li.innerHTML = `<a class="dropdown-item font-monospace text-sm search-history-item" href="#" data-query="${query}">
        <i class="fa-solid fa-clock text-muted me-1"></i>${query}
      </a>`;
      suggestionsList.appendChild(li);
    });
    
    // Attach click handlers
    suggestionsList.querySelectorAll('.search-history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const query = e.currentTarget.dataset.query;
        const searchInput = document.getElementById('globalSearchInput');
        if(searchInput){
          searchInput.value = query;
          performGlobalSearch(query);
        }
      });
    });
  }
  
  // Module-specific filter functions
  window.filterIPTable = function(columnName, query){
    const tbody = document.getElementById('ipTableBody');
    if(!tbody) return;
    
    const query_lower = query.toLowerCase();
    const columnMap = { 'ip': 0, 'role': 1, 'events': 2 };
    const colIndex = columnMap[columnName.toLowerCase()];
    
    filterTable('ipTableBody', query, colIndex);
  };
  
  window.filterTimelineByType = function(eventType){
    const tbody = document.getElementById('timelineBody');
    if(!tbody) return;
    
    let visibleCount = 0;
    const rows = tbody.querySelectorAll('tr:not(.no-data-row)');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if(cells.length >= 2){
        const eventCell = cells[1];
        const match = eventType === '' || eventCell.textContent.includes(eventType);
        row.style.display = match ? '' : 'none';
        if(match) visibleCount++;
      }
    });
    
    if(visibleCount === 0 && eventType){
      const noResultsRow = document.createElement('tr');
      noResultsRow.className = 'no-data-row text-muted text-center';
      noResultsRow.innerHTML = `<td colspan="3" class="py-3 font-monospace text-sm">No events of type "${eventType}"</td>`;
      tbody.appendChild(noResultsRow);
    } else {
      tbody.querySelectorAll('.no-data-row').forEach(row => row.remove());
    }
  };
  
  window.filterTimelineByDateRange = function(startDate, endDate){
    const tbody = document.getElementById('timelineBody');
    if(!tbody) return;
    
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;
    let visibleCount = 0;
    
    const rows = tbody.querySelectorAll('tr:not(.no-data-row)');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if(cells.length > 0){
        const timestamp = cells[0].textContent.trim();
        try {
          const rowTime = new Date(timestamp).getTime();
          const match = rowTime >= start && rowTime <= end;
          row.style.display = match ? '' : 'none';
          if(match) visibleCount++;
        } catch(e) {
          row.style.display = '';
          visibleCount++;
        }
      }
    });
    
    if(visibleCount === 0 && (startDate || endDate)){
      const noResultsRow = document.createElement('tr');
      noResultsRow.className = 'no-data-row text-muted text-center';
      noResultsRow.innerHTML = `<td colspan="3" class="py-3 font-monospace text-sm">No events in date range</td>`;
      tbody.appendChild(noResultsRow);
    } else {
      tbody.querySelectorAll('.no-data-row').forEach(row => row.remove());
    }
  };
  
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', initSearch);
  
})();
