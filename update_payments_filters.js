const fs = require('fs');

const paymentsPath = '/opt/adminflow/client/app/payments/page.tsx';
let content = fs.readFileSync(paymentsPath, 'utf8');

// 1. Add Tooltip imports if not present
if (!content.includes("import { Tooltip")) {
  content = content.replace(
    'import { cn } from "@/lib/utils";',
    `import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";`
  );
  console.log('Added Tooltip imports');
}

// 2. Change default dateFilter from "thisMonth" to "all"
content = content.replace(
  'useState<"thisMonth" | "lastMonth" | "thisWeek" | "all" | "custom">("thisMonth")',
  'useState<"thisMonth" | "lastMonth" | "thisWeek" | "all" | "custom">("all")'
);
console.log('Changed default dateFilter to "all"');

// 3. Change default statusFilter from "todos" to "todos" (already correct, but ensuring no default selection)
// No change needed

// 4. Replace the filter bar with a new ticket-style filter bar with icon buttons and tooltips
const oldFilterBar = `<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por factura, cliente, concepto o ticket..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value: "todos" | PaymentStatus) =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Estado" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="Pendiente">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-red-500" />
                        Pendiente
                      </div>
                    </SelectItem>
                    <SelectItem value="Enviado">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        Enviado
                      </div>
                    </SelectItem>
                    <SelectItem value="A confirmar">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                        A confirmar
                      </div>
                    </SelectItem>
                    <SelectItem value="Emitir Factura">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-500" />
                        Emitir Factura
                      </div>
                    </SelectItem>
                    <SelectItem value="Pagado">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Pagado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={currencyFilter}
                  onValueChange={(value: "todos" | "UYU" | "USD") =>
                    setCurrencyFilter(value)
                  }
                >
                  <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Moneda" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="UYU">
                      <div className="flex items-center gap-2">
                        <ReactCountryFlag
                          svg
                          countryCode="UY"
                          className="inline-block h-4 w-5"
                          aria-label="Uruguay"
                        />
                        UYU
                      </div>
                    </SelectItem>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2">
                        <ReactCountryFlag
                          svg
                          countryCode="US"
                          className="inline-block h-4 w-5"
                          aria-label="Estados Unidos"
                        />
                        USD
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={dateFilter}
                  onValueChange={(value: "thisMonth" | "lastMonth" | "thisWeek" | "all" | "custom") => {
                    setDateFilter(value);
                    if (value !== "custom") setCustomDate(undefined);
                  }}
                >
                  <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Fecha" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">Este mes</SelectItem>
                    <SelectItem value="lastMonth">Mes pasado</SelectItem>
                    <SelectItem value="thisWeek">Esta semana</SelectItem>
                    <SelectItem value="custom">Filtrar por fecha</SelectItem>
                    <SelectSeparator />
                    <SelectItem value="all">Todas las fechas</SelectItem>
                  </SelectContent>
                </Select>

                {dateFilter === "custom" && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[180px] justify-start text-left font-normal",
                            !customDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDate ? (
                            format(customDate, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customDate}
                          onSelect={setCustomDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {customDate && (
                      <Button variant="ghost" size="icon" onClick={() => setCustomDate(undefined)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredPayments.length} {filteredPayments.length === 1 ? 'resultado' : 'resultados'}
            </div>
          </div>`;

const newFilterBar = `<TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={statusFilter === "todos" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 w-7 p-0", statusFilter === "todos" && "bg-white shadow-sm")}
                        onClick={() => setStatusFilter("todos")}
                      >
                        <Filter className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Todos los estados</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={statusFilter === "Pendiente" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 w-7 p-0", statusFilter === "Pendiente" && "bg-red-500 text-white hover:bg-red-600")}
                        onClick={() => setStatusFilter("Pendiente")}
                      >
                        <Clock3 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Pendiente</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={statusFilter === "Enviado" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 w-7 p-0", statusFilter === "Enviado" && "bg-blue-500 text-white hover:bg-blue-600")}
                        onClick={() => setStatusFilter("Enviado")}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Enviado</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={statusFilter === "A confirmar" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 w-7 p-0", statusFilter === "A confirmar" && "bg-orange-500 text-white hover:bg-orange-600")}
                        onClick={() => setStatusFilter("A confirmar")}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>A confirmar</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={statusFilter === "Emitir Factura" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 w-7 p-0", statusFilter === "Emitir Factura" && "bg-amber-500 text-white hover:bg-amber-600")}
                        onClick={() => setStatusFilter("Emitir Factura")}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Emitir Factura</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={statusFilter === "Pagado" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 w-7 p-0", statusFilter === "Pagado" && "bg-emerald-500 text-white hover:bg-emerald-600")}
                        onClick={() => setStatusFilter("Pagado")}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Pagado</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Currency Filter */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={currencyFilter === "todos" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 px-2", currencyFilter === "todos" && "bg-white shadow-sm")}
                        onClick={() => setCurrencyFilter("todos")}
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Todas las monedas</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={currencyFilter === "UYU" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 px-2", currencyFilter === "UYU" && "bg-white shadow-sm")}
                        onClick={() => setCurrencyFilter("UYU")}
                      >
                        <ReactCountryFlag svg countryCode="UY" className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Pesos (UYU)</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={currencyFilter === "USD" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 px-2", currencyFilter === "USD" && "bg-white shadow-sm")}
                        onClick={() => setCurrencyFilter("USD")}
                      >
                        <ReactCountryFlag svg countryCode="US" className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Dólares (USD)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={dateFilter === "all" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 px-2 text-xs", dateFilter === "all" && "bg-white shadow-sm")}
                        onClick={() => { setDateFilter("all"); setCustomDate(undefined); }}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Todas las fechas</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={dateFilter === "thisWeek" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 px-2 text-xs", dateFilter === "thisWeek" && "bg-white shadow-sm")}
                        onClick={() => { setDateFilter("thisWeek"); setCustomDate(undefined); }}
                      >
                        7d
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Esta semana</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={dateFilter === "thisMonth" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 px-2 text-xs", dateFilter === "thisMonth" && "bg-white shadow-sm")}
                        onClick={() => { setDateFilter("thisMonth"); setCustomDate(undefined); }}
                      >
                        30d
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Este mes</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={dateFilter === "lastMonth" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 px-2 text-xs", dateFilter === "lastMonth" && "bg-white shadow-sm")}
                        onClick={() => { setDateFilter("lastMonth"); setCustomDate(undefined); }}
                      >
                        -30d
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Mes pasado</p>
                    </TooltipContent>
                  </Tooltip>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={dateFilter === "custom" ? "default" : "ghost"}
                        size="sm"
                        className={cn("h-7 px-2", dateFilter === "custom" && "bg-white shadow-sm")}
                      >
                        {customDate ? format(customDate, "dd/MM", { locale: es }) : <CalendarIcon className="h-3.5 w-3.5" />}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDate}
                        onSelect={(date) => { setCustomDate(date); setDateFilter("custom"); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Clear filters */}
                {(statusFilter !== "todos" || currencyFilter !== "todos" || dateFilter !== "all" || search) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                        onClick={() => {
                          setStatusFilter("todos");
                          setCurrencyFilter("todos");
                          setDateFilter("all");
                          setCustomDate(undefined);
                          setSearch("");
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="animate-in fade-in-0 zoom-in-95">
                      <p>Limpiar filtros</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredPayments.length} resultado{filteredPayments.length !== 1 ? 's' : ''}
              </div>
            </div>
          </TooltipProvider>`;

// Try to replace with LF
if (content.includes(oldFilterBar)) {
  content = content.replace(oldFilterBar, newFilterBar);
  console.log('Replaced filter bar (LF)');
} else {
  // Try CRLF
  const oldFilterBarCRLF = oldFilterBar.replace(/\n/g, '\r\n');
  if (content.includes(oldFilterBarCRLF)) {
    content = content.replace(oldFilterBarCRLF, newFilterBar.replace(/\n/g, '\r\n'));
    console.log('Replaced filter bar (CRLF)');
  } else {
    console.log('Could not find exact filter bar pattern - will need manual update');
  }
}

fs.writeFileSync(paymentsPath, content);
console.log('Done updating payments page');
