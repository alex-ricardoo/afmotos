import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe('Integration: Vehicle Lookup Locks & Audit (Staging/Branch)', { skip: !supabaseUrl || !supabaseKey }, () => {
  const supabase = createClient(supabaseUrl || '', supabaseKey || '');
  
  const testPlate = 'TST0I24';
  const provider = 'apibrasil';
  const operation = 'veiculos-total';
  let activeLockKey: string;
  let activeLogicalRequestId: string;

  before(async () => {
    if (!supabaseUrl || !supabaseKey) return;
    // Cleanup any existing locks or attempts for this test plate
    await supabase.from('vehicle_provider_locks').delete().eq('plate_normalized', testPlate);
    await supabase.from('vehicle_provider_attempts').delete().eq('plate_normalized', testPlate);
  });

  after(async () => {
    if (!supabaseUrl || !supabaseKey) return;
    // Cleanup after tests
    await supabase.from('vehicle_provider_locks').delete().eq('plate_normalized', testPlate);
    await supabase.from('vehicle_provider_attempts').delete().eq('plate_normalized', testPlate);
  });

  it('should acquire a new lock successfully', async () => {
    const logicalRequestId = 'req_int_test_1';
    activeLogicalRequestId = logicalRequestId;
    
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test',
      p_logical_request_id: logicalRequestId,
      p_ttl_seconds: 60,
    });

    assert.ifError(error);
    assert.ok(data);
    assert.equal(data.length, 1);
    assert.equal(data[0].acquired, true);
    assert.equal(data[0].recovered_expired, false);
    activeLockKey = data[0].lock_key;
  });

  it('should deny lock acquisition for a concurrent request with different logical_request_id', async () => {
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test-concurrent',
      p_logical_request_id: 'req_int_test_2',
      p_ttl_seconds: 60,
    });

    assert.ifError(error);
    assert.ok(data);
    assert.equal(data.length, 1);
    assert.equal(data[0].acquired, false);
    assert.equal(data[0].lock_key, activeLockKey);
  });

  it('should allow lock acquisition (idempotency) for the same logical_request_id', async () => {
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test',
      p_logical_request_id: activeLogicalRequestId,
      p_ttl_seconds: 60,
    });

    assert.ifError(error);
    assert.ok(data);
    assert.equal(data.length, 1);
    assert.equal(data[0].acquired, true);
    assert.equal(data[0].recovered_expired, false);
  });
  
  it('should create an attempt record with status request_sent', async () => {
    const { data, error } = await supabase
      .from('vehicle_provider_attempts')
      .insert({
        provider,
        operation,
        plate_normalized: testPlate,
        status: 'request_sent',
        logical_request_id: activeLogicalRequestId,
      })
      .select('*')
      .single();
      
    assert.ifError(error);
    assert.ok(data);
    assert.equal(data.status, 'request_sent');
  });

  it('should prevent recovery of an expired lock if the last attempt is ambiguous', async () => {
    // 1. Manually expire the lock to simulate a timeout
    const { error: updateError } = await supabase
      .from('vehicle_provider_locks')
      .update({ lock_expires_at: new Date(Date.now() - 10000).toISOString() })
      .eq('lock_key', activeLockKey);
    assert.ifError(updateError);

    // 2. Try to acquire lock again with a new request ID
    const newLogicalRequestId = 'req_int_test_3';
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test-3',
      p_logical_request_id: newLogicalRequestId,
      p_ttl_seconds: 60,
    });

    // Should FAIL to acquire because the last attempt ('request_sent') is ambiguous!
    assert.ifError(error);
    assert.ok(data);
    assert.equal(data.length, 1);
    assert.equal(data[0].acquired, false);
    // The RPC returns `recovered_expired: false` when blocked by ambiguous attempts
    assert.equal(data[0].recovered_expired, false);
  });
  
  it('should allow recovery if the attempt is not ambiguous', async () => {
    // 1. Update the previous attempt to a terminal unambiguous state ('completed')
    const { error: updateError } = await supabase
      .from('vehicle_provider_attempts')
      .update({ status: 'completed' })
      .eq('logical_request_id', activeLogicalRequestId);
    assert.ifError(updateError);
    
    // 2. Try to acquire lock again with the new request ID
    const newLogicalRequestId = 'req_int_test_3';
    const { data, error } = await supabase.rpc('acquire_vehicle_provider_lock', {
      p_provider: provider,
      p_operation: operation,
      p_plate_normalized: testPlate,
      p_locked_by: 'integration-test-3',
      p_logical_request_id: newLogicalRequestId,
      p_ttl_seconds: 60,
    });

    // Should SUCCEED to acquire and recover
    assert.ifError(error);
    assert.ok(data);
    assert.equal(data.length, 1);
    assert.equal(data[0].acquired, true);
    assert.equal(data[0].recovered_expired, true);
  });
});
