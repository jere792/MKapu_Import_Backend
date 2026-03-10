// logistics/src/core/warehouse/infrastructure/adapters/in/controllers/warehouse-reports.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository }       from '@nestjs/typeorm';
import { Repository }             from 'typeorm';

import { StockOrmEntity }                   from '../../../../inventory/infrastructure/entity/stock-orm-entity';
import { InventoryMovementOrmEntity }       from '../../../../inventory/infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from '../../../../inventory/infrastructure/entity/inventory-movement-detail-orm.entity';
import { console } from 'inspector/promises';

export class WarehouseReportsFilterDto {
  periodo?: string;  // 'semana' | 'mes' | 'anio'
  anio?:    string;
  sedeId?:  string;  // ✅ id_sede es string en StockOrmEntity
}

@Controller('warehouse/reports')
export class WarehouseReportsController {

  constructor(
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,

    @InjectRepository(InventoryMovementOrmEntity)
    private readonly movRepo: Repository<InventoryMovementOrmEntity>,

    @InjectRepository(InventoryMovementDetailOrmEntity)
    private readonly detRepo: Repository<InventoryMovementDetailOrmEntity>,
  ) {}

// ── GET /warehouse/reports/kpis ──────────────────────────────────
// warehouse-reports.controller.ts
@Get('kpis')
async getKpis(@Query() filters: WarehouseReportsFilterDto) {
    console.log('🔍 RAW query completo:', filters);
    console.log('🔍 sedeId tipo:', typeof filters.sedeId, 'valor:', filters.sedeId);
    console.log('🔍 filters recibidos:', JSON.stringify(filters)); // ← agregar esto
    const sedeId = filters.sedeId ?? null;
    console.log('🔍 sedeId usado:', sedeId);      
    const { fechaDesde, fechaHasta } = this.getRangoFechas(filters.periodo ?? 'mes');

    //  Filtro de sede corregido — id_sede es VARCHAR en stock
    const stockStats: any[] = await this.stockRepo.query(`
      SELECT
        COALESCE(SUM(s.cantidad), 0)                          AS valor_inventario,
        SUM(CASE WHEN s.cantidad <= 10 THEN 1 ELSE 0 END)     AS items_bajo_stock,
        COUNT(*)                                              AS total_items
      FROM stock s
      WHERE (? IS NULL OR s.id_sede = ?)
    `, [sedeId, sedeId]);

    // JOIN con stock para filtrar movimientos por sede
    const movStats: any[] = await this.movRepo.query(`
      SELECT
        COUNT(DISTINCT m.id_movimiento)                             AS total_movimientos,
        SUM(CASE WHEN d.tipo = 'SALIDA' THEN 1 ELSE 0 END)         AS total_salidas
      FROM movimiento_inventario m
      JOIN detalle_movimiento_inventario d ON d.id_movimiento = m.id_movimiento
      JOIN stock s ON s.id_almacen = d.id_almacen
      WHERE m.fecha BETWEEN ? AND ?
        AND (? IS NULL OR s.id_sede = ?)
    `, [fechaDesde, fechaHasta, sedeId, sedeId]);

    const sk = stockStats[0] ?? {};
    const mv = movStats[0]   ?? {};

    const valorInventario = parseFloat(sk.valor_inventario ?? '0');
    const itemsBajoStock  = parseInt(sk.items_bajo_stock   ?? '0', 10);
    const totalItems      = parseInt(sk.total_items        ?? '0', 10);
    const totalMov        = parseInt(mv.total_movimientos  ?? '0', 10);
    const totalSalidas    = parseInt(mv.total_salidas      ?? '0', 10);

    const exactitud = totalItems > 0
      ? parseFloat(((totalItems - itemsBajoStock) / totalItems * 100).toFixed(1))
      : 100;

    const rotacion = totalMov > 0
      ? parseFloat((totalSalidas / totalMov * 12).toFixed(1))
      : 0;

    return {
      valorInventario,
      itemsBajoStock,
      exactitudInventario: exactitud,
      rotacionPromedio:    rotacion,
      tendencias: {
        valorInventario:     '+2.1% vs periodo anterior',
        itemsBajoStock:      'Revisar reposición',
        exactitudInventario: '+0.8 puntos',
        rotacionPromedio:    'Veces por año',
      },
    };
  }

  // ── GET /warehouse/reports/rendimiento-chart ──────────────────────
  @Get('rendimiento-chart')
  async getRendimientoChart(@Query() filters: WarehouseReportsFilterDto) {
    const periodo = filters.periodo ?? 'mes';
    const { fechaDesde, fechaHasta } = this.getRangoFechas(periodo);
    const sedeId = filters.sedeId ?? null;

    let labels: string[];
    let groupExpr: string;

    if (periodo === 'semana') {
      labels    = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      groupExpr = `DATE_FORMAT(m.fecha, '%a')`;
    } else if (periodo === 'anio') {
      labels    = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      groupExpr = `DATE_FORMAT(m.fecha, '%b')`;
    } else {
      labels    = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
      groupExpr = `CONCAT('Sem ', CEIL(DAY(m.fecha) / 7))`;
    }

    // ✅ JOIN con stock y detalle para filtrar por sede
    const rows: any[] = await this.movRepo.query(`
      SELECT ${groupExpr} AS label, COUNT(DISTINCT m.id_movimiento) AS cantidad
      FROM movimiento_inventario m
      JOIN detalle_movimiento_inventario d ON d.id_movimiento = m.id_movimiento
      JOIN stock s ON s.id_almacen = d.id_almacen
      WHERE m.fecha BETWEEN ? AND ?
        AND (? IS NULL OR s.id_sede = ?)
      GROUP BY label
      ORDER BY MIN(m.fecha)
    `, [fechaDesde, fechaHasta, sedeId, sedeId]);

    const datos = labels.map(label => {
      const row = rows.find((r: any) => r.label?.trim() === label);
      return row ? parseInt(row.cantidad, 10) : 0;
    });

    return { labels, datos };
  }

  // ── GET /warehouse/reports/salud-stock ────────────────────────────
  @Get('salud-stock')
  async getSaludStock(@Query() filters: WarehouseReportsFilterDto) {
    const sedeId = filters.sedeId ?? null;

    // ✅ Tres categorías mutuamente excluyentes y correctas
    const rows: any[] = await this.stockRepo.query(`
      SELECT
        SUM(CASE WHEN s.cantidad > 20 AND s.cantidad <= 50 THEN 1 ELSE 0 END) AS optimo,
        SUM(CASE WHEN s.cantidad <= 10                     THEN 1 ELSE 0 END) AS bajo_stock,
        SUM(CASE WHEN s.cantidad > 50                      THEN 1 ELSE 0 END) AS sobre_stock
      FROM stock s
      WHERE (? IS NULL OR s.id_sede = ?)
    `, [sedeId, sedeId]);

    const row = rows[0] ?? {};
    return {
      optimo:     parseInt(row.optimo      ?? '0', 10),
      bajoStock:  parseInt(row.bajo_stock  ?? '0', 10),
      sobreStock: parseInt(row.sobre_stock ?? '0', 10),
    };
  }

  // ── GET /warehouse/reports/movimientos-recientes ──────────────────
  @Get('movimientos-recientes')
  async getMovimientosRecientes(@Query() filters: WarehouseReportsFilterDto) {
    const sedeId = filters.sedeId ?? null;

    // ✅ Filtro de sede directo via JOIN con stock
    const rows: any[] = await this.movRepo.query(`
      SELECT
        DATE_FORMAT(m.fecha, '%d %b %Y %H:%i') AS fecha,
        m.tipo_origen                           AS tipo,
        CONCAT(m.ref_tabla, ' #', m.ref_id)    AS referencia,
        SUM(d.cantidad)                         AS cantidad,
        'Sistema'                               AS usuario
      FROM movimiento_inventario m
      JOIN detalle_movimiento_inventario d ON d.id_movimiento = m.id_movimiento
      JOIN stock s ON s.id_almacen = d.id_almacen
      WHERE (? IS NULL OR s.id_sede = ?)
      GROUP BY m.id_movimiento, m.fecha, m.tipo_origen, m.ref_tabla, m.ref_id
      ORDER BY m.fecha DESC
      LIMIT 10
    `, [sedeId, sedeId]);

    return rows.map((r: any) => ({
      fecha:      r.fecha,
      tipo:       this.mapTipoMovimiento(r.tipo),
      referencia: r.referencia,
      producto:   '—',
      cantidad:   parseInt(r.cantidad, 10),
      usuario:    r.usuario,
    }));
  }

  // ── GET /warehouse/reports/productos-criticos ─────────────────────
  @Get('productos-criticos')
  async getProductosCriticos(@Query() filters: WarehouseReportsFilterDto) {
    const sedeId = filters.sedeId ?? null;

    // ✅ Filtro de sede directo en WHERE, sin LEFT JOIN innecesario
    const rows: any[] = await this.stockRepo.query(`
      SELECT
        dc.cod_prod        AS codigo,
        dc.descripcion     AS descripcion,
        s.cantidad         AS stock,
        COALESCE(dc.stock_sistema, 10) AS stock_minimo,
        COALESCE(
          (SELECT SUM(d2.cantidad) / NULLIF(s.cantidad, 0)
           FROM detalle_movimiento_inventario d2
           JOIN movimiento_inventario m2 ON m2.id_movimiento = d2.id_movimiento
           WHERE d2.id_producto = s.id_producto
             AND d2.id_almacen  = s.id_almacen
             AND d2.tipo        = 'SALIDA'
             AND m2.fecha      >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ), 0
        )                  AS rotacion
      FROM stock s
      JOIN (
        SELECT dc1.id_producto, dc1.id_almacen,
               dc1.cod_prod, dc1.descripcion, dc1.stock_sistema
        FROM detalle_conteo dc1
        INNER JOIN (
          SELECT id_producto, MAX(id_detalle) AS max_id
          FROM detalle_conteo
          GROUP BY id_producto
        ) latest ON latest.id_producto = dc1.id_producto
               AND latest.max_id       = dc1.id_detalle
      ) dc ON dc.id_producto = s.id_producto
           AND dc.id_almacen  = s.id_almacen
      WHERE (? IS NULL OR s.id_sede = ?)
        AND s.cantidad <= COALESCE(dc.stock_sistema, 10)
      ORDER BY s.cantidad ASC
      LIMIT 10
    `, [sedeId, sedeId]);

    return rows.map((r: any) => ({
      codigo:      r.codigo,
      descripcion: r.descripcion,
      stock:       parseInt(r.stock,        10),
      stockMinimo: parseInt(r.stock_minimo, 10),
      rotacion:    parseFloat(r.rotacion   ?? '0'),
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private mapTipoMovimiento(tipo: string): 'INGRESO' | 'SALIDA' | 'AJUSTE' {
    if (tipo === 'COMPRA')        return 'INGRESO';
    if (tipo === 'VENTA')         return 'SALIDA';
    if (tipo === 'TRANSFERENCIA') return 'INGRESO';
    return 'AJUSTE';
  }

  private getRangoFechas(periodo: string): { fechaDesde: Date; fechaHasta: Date } {
    const ahora = new Date();
    let fechaDesde: Date;
    switch (periodo) {
      case 'semana':
        fechaDesde = new Date(ahora);
        fechaDesde.setDate(ahora.getDate() - 7);
        break;
      case 'anio':
        fechaDesde = new Date(ahora.getFullYear(), 0, 1);
        break;
      default: // mes
        fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
    }
    return { fechaDesde, fechaHasta: ahora };
  }
}