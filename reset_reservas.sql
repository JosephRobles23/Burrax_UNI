-- Limpiar tabla de reservas
DELETE FROM reservas;

-- Regenerar datos con límite de 90 personas
DO $$
DECLARE
    fecha DATE;
    dia INTEGER;
    t1 INTEGER; t2 INTEGER; t3 INTEGER; t4 INTEGER;
    i INTEGER;
    usuario_id UUID;
BEGIN
    
    FOR dia IN 0..4 LOOP  -- 5 días laborables
        fecha := CURRENT_DATE - INTERVAL '5 days' + (dia || ' days')::INTERVAL;
        
        -- Definir reservas por turno (máx 90 total)
        t1 := 12 + FLOOR(RANDOM() * 3);  -- 12-14 (máx 15)
        t2 := 13 + FLOOR(RANDOM() * 3);  -- 13-15 (máx 15) 
        t3 := 14 + FLOOR(RANDOM() * 2);  -- 14-15 (máx 15)
        t4 := 38 + FLOOR(RANDOM() * 7);  -- 38-44 (máx 45)
        
        -- TURNO 1: Asientos
        FOR i IN 1..t1 LOOP
            SELECT id INTO usuario_id FROM users ORDER BY RANDOM() LIMIT 1;
            INSERT INTO reservas (id_usuario, tipo_pase, estado, franja_horaria, created_at)
            VALUES (usuario_id, 'asiento', 'validado', '17:00-17:30', 
                   fecha + INTERVAL '16 hours' + (RANDOM() * INTERVAL '1 hour'));
        END LOOP;
        
        -- TURNO 2: Asientos
        FOR i IN 1..t2 LOOP
            SELECT id INTO usuario_id FROM users ORDER BY RANDOM() LIMIT 1;
            INSERT INTO reservas (id_usuario, tipo_pase, estado, franja_horaria, created_at)
            VALUES (usuario_id, 'asiento', 'validado', '18:15-18:35', 
                   fecha + INTERVAL '17 hours' + (RANDOM() * INTERVAL '1 hour'));
        END LOOP;
        
        -- TURNO 3: Asientos
        FOR i IN 1..t3 LOOP
            SELECT id INTO usuario_id FROM users ORDER BY RANDOM() LIMIT 1;
            INSERT INTO reservas (id_usuario, tipo_pase, estado, franja_horaria, created_at)
            VALUES (usuario_id, 'asiento', 'validado', '19:00-19:30', 
                   fecha + INTERVAL '18 hours' + (RANDOM() * INTERVAL '1 hour'));
        END LOOP;
        
        -- TURNO 4: Parados
        FOR i IN 1..t4 LOOP
            SELECT id INTO usuario_id FROM users ORDER BY RANDOM() LIMIT 1;
            INSERT INTO reservas (id_usuario, tipo_pase, estado, franja_horaria, created_at)
            VALUES (usuario_id, 'parado', 'validado', '19:30-19:55', 
                   fecha + INTERVAL '18.5 hours' + (RANDOM() * INTERVAL '1 hour'));
        END LOOP;
        
        RAISE NOTICE 'Día %: T1=% T2=% T3=% T4=% Total=%', 
            TO_CHAR(fecha, 'DD/MM'), t1, t2, t3, t4, (t1+t2+t3+t4);
    END LOOP;
END $$;

-- Verificar resultados
SELECT COUNT(*) as total_reservas FROM reservas; 