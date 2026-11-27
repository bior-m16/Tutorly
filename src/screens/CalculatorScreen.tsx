import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AngleMode, fitFont, formatNumber, toFraction, tryEvaluate } from '../calc/engine';
import { CATEGORIES, Category, convert } from '../calc/units';
import { addCalcHistory, CalcEntry, clearCalcHistory, loadCalcHistory } from '../calc/history';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'scientific' | 'converter';

const OPERATORS = ['+', '−', '×', '÷', '^'];

export default function CalculatorScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('scientific');
  const [history, setHistory] = useState<CalcEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadCalcHistory().then(setHistory);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color="#1D1A33" />
        </TouchableOpacity>
        <View style={styles.segment}>
          {(['scientific', 'converter'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.segBtn, tab === t && styles.segActive]} onPress={() => setTab(t)}>
              <Text style={[styles.segText, tab === t && styles.segTextActive]}>
                {t === 'scientific' ? 'Scientific' : 'Converter'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {tab === 'scientific' ? (
        <Scientific
          onHistory={() => setShowHistory(true)}
          history={history}
          onSaved={setHistory}
          onExplain={(expr) => navigation.navigate('TypeQuestion', { initial: `Work out ${expr} and show each step.` })}
        />
      ) : (
        <Converter onHistory={() => setShowHistory(true)} />
      )}

      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowHistory(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>History</Text>
            {history.length > 0 ? (
              <TouchableOpacity
                onPress={async () => {
                  await clearCalcHistory();
                  setHistory([]);
                }}
              >
                <Text style={styles.clear}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView style={{ maxHeight: 360 }}>
            {history.length === 0 ? <Text style={styles.empty}>Your calculations will show up here.</Text> : null}
            {history.map((h, i) => (
              <View key={i} style={styles.histRow}>
                <Text style={styles.histExpr}>{h.expr}</Text>
                <Text style={styles.histResult}>= {h.result}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- Scientific ---------------- */

function Scientific(props: {
  onHistory: () => void;
  history: CalcEntry[];
  onSaved: (h: CalcEntry[]) => void;
  onExplain: (expr: string) => void;
}) {
  const [expr, setExpr] = useState('');
  const [mode, setMode] = useState<AngleMode>('deg');
  const [done, setDone] = useState<string | null>(null); // the expression that was just evaluated
  const [answer, setAnswer] = useState<number | null>(null);
  const [asFraction, setAsFraction] = useState(false);

  const value = useMemo(() => tryEvaluate(expr, mode), [expr, mode]);
  const shown = done !== null ? answer : value;
  const fraction = shown !== null && asFraction ? toFraction(shown) : null;
  const display = shown === null ? (expr ? '' : '0') : fraction ?? formatNumber(shown);

  const press = (key: string) => {
    if (done !== null) {
      // After "=", an operator continues from the answer; anything else starts fresh.
      const startFromAnswer = OPERATORS.includes(key) || ['!', '%', '²'].includes(key);
      setExpr(startFromAnswer && answer !== null ? `${formatNumber(answer).replace('-', '−')}${key}` : key);
      setDone(null);
      return;
    }
    setExpr((e) => e + key);
  };

  const backspace = () => {
    if (done !== null) {
      setDone(null);
      return;
    }
    setExpr((e) => {
      const m = e.match(/(asin|acos|atan|sin|cos|tan|ln|log|abs)\($/);
      return m ? e.slice(0, -m[0].length) : e.slice(0, -1);
    });
  };

  const clear = () => {
    setExpr('');
    setDone(null);
  };

  const equals = async () => {
    if (value === null) return;
    setAnswer(value);
    setDone(expr);
    props.onSaved(await addCalcHistory({ expr, result: formatNumber(value) }));
  };

  const insertAns = () => {
    if (answer === null) return;
    press(`(${formatNumber(answer).replace('-', '−')})`);
  };

  const sci: { label: string; on: () => void; active?: boolean; small?: boolean }[][] = [
    [
      { label: mode === 'deg' ? 'Deg' : 'Rad', on: () => setMode(mode === 'deg' ? 'rad' : 'deg'), active: true },
      { label: 'S⇔D', on: () => setAsFraction(!asFraction), active: asFraction },
      { label: '(', on: () => press('(') },
      { label: ')', on: () => press(')') },
      { label: 'nCr', on: () => press('C') },
      { label: 'nPr', on: () => press('P') },
    ],
    [
      { label: 'sin', on: () => press('sin(') },
      { label: 'cos', on: () => press('cos(') },
      { label: 'tan', on: () => press('tan(') },
      { label: 'ln', on: () => press('ln(') },
      { label: 'log', on: () => press('log(') },
      { label: 'e', on: () => press('e') },
    ],
    [
      { label: 'sin⁻¹', on: () => press('asin('), small: true },
      { label: 'cos⁻¹', on: () => press('acos('), small: true },
      { label: 'tan⁻¹', on: () => press('atan('), small: true },
      { label: 'π', on: () => press('π') },
      { label: 'x!', on: () => press('!') },
      { label: 'xʸ', on: () => press('^') },
    ],
    [
      { label: 'x²', on: () => press('²') },
      { label: '√x', on: () => press('√') },
      { label: '∛x', on: () => press('∛') },
      { label: '|x|', on: () => press('abs(') },
      { label: '1/x', on: () => press('^(−1)'), small: true },
      { label: 'Ans', on: insertAns },
    ],
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.display}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exprScroll}>
          <Text style={styles.expr}>{done ?? expr}</Text>
        </ScrollView>
        <Text
          style={[
            styles.result,
            { fontSize: fitFont(display, 52) },
            done === null && expr ? [styles.preview, { fontSize: fitFont(display, 30) }] : null,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {done === null && expr && display ? `= ${display}` : display}
        </Text>
        {(done ?? expr) ? (
          <TouchableOpacity style={styles.explain} onPress={() => props.onExplain(done ?? expr)} activeOpacity={0.8}>
            <Ionicons name="sparkles" size={14} color="#1D1A33" />
            <Text style={styles.explainText}>Explain step by step</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.sciPad}>
        {sci.map((row, r) => (
          <View key={r} style={styles.sciRow}>
            {row.map((k) => (
              <TouchableOpacity
                key={k.label}
                style={[styles.sciKey, k.active && styles.sciKeyOn]}
                onPress={k.on}
                activeOpacity={0.6}
              >
                <Text style={[styles.sciText, k.small && { fontSize: 13 }, k.active && { color: '#1D1A33' }]}>{k.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <Keypad onKey={press} onClear={clear} onBack={backspace} onEquals={equals} onHistory={props.onHistory} />
    </View>
  );
}

/* ---------------- Converter ---------------- */

function Converter(props: { onHistory: () => void }) {
  const [cat, setCat] = useState<Category>(CATEGORIES[0]);
  const [fromId, setFromId] = useState(CATEGORIES[0].defaults[0]);
  const [toId, setToId] = useState(CATEGORIES[0].defaults[1]);
  const [input, setInput] = useState('');
  const [picking, setPicking] = useState<null | 'from' | 'to'>(null);

  const from = cat.units.find((u) => u.id === fromId) ?? cat.units[0];
  const to = cat.units.find((u) => u.id === toId) ?? cat.units[1];
  const value = input ? tryEvaluate(input, 'rad') : 0;
  const out = value === null ? null : convert(value, from, to);
  const outText = out === null ? '—' : formatNumber(out, 10);

  const chooseCat = (c: Category) => {
    setCat(c);
    setFromId(c.defaults[0]);
    setToId(c.defaults[1]);
  };

  const swap = () => {
    setFromId(to.id);
    setToId(from.id);
    if (out !== null && input) setInput(formatNumber(out, 10).replace('-', '−'));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c.id} style={[styles.catChip, c.id === cat.id && styles.catChipOn]} onPress={() => chooseCat(c)}>
            <Text style={[styles.catText, c.id === cat.id && { color: '#FFF' }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.convBox}>
        <View style={styles.convRow}>
          <Text style={[styles.convValue, { fontSize: fitFont(input || '0', 48) }]} numberOfLines={1}>{input || '0'}</Text>
          <TouchableOpacity style={styles.unitBtn} onPress={() => setPicking('from')}>
            <Text style={styles.unitText}>{from.label}</Text>
            <Ionicons name="chevron-expand" size={16} color="#6B6585" />
          </TouchableOpacity>
        </View>
        <View style={styles.convMid}>
          <TouchableOpacity onPress={swap} style={styles.swap} accessibilityLabel="Swap units">
            <Ionicons name="swap-vertical" size={20} color="#1D1A33" />
          </TouchableOpacity>
          <View style={styles.convLine} />
        </View>
        <View style={styles.convRow}>
          <Text style={[styles.convValue, { color: '#6B6585', fontSize: fitFont(outText, 48) }]} numberOfLines={1}>
            {outText}
          </Text>
          <TouchableOpacity style={styles.unitBtn} onPress={() => setPicking('to')}>
            <Text style={styles.unitText}>{to.label}</Text>
            <Ionicons name="chevron-expand" size={16} color="#6B6585" />
          </TouchableOpacity>
        </View>
      </View>

      <Keypad
        onKey={(k) => setInput((s) => s + k)}
        onClear={() => setInput('')}
        onBack={() => setInput((s) => s.slice(0, -1))}
        onEquals={() => value !== null && input && setInput(formatNumber(value).replace('-', '−'))}
        onHistory={props.onHistory}
      />

      <Modal visible={picking !== null} transparent animationType="slide" onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{cat.label}: convert {picking}</Text>
          <ScrollView style={{ maxHeight: 360, marginTop: 8 }}>
            {cat.units.map((u) => {
              const selected = (picking === 'from' ? from.id : to.id) === u.id;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={styles.unitRow}
                  onPress={() => {
                    if (picking === 'from') setFromId(u.id);
                    else setToId(u.id);
                    setPicking(null);
                  }}
                >
                  <Text style={[styles.unitRowText, selected && { fontWeight: '800' }]}>{u.label}</Text>
                  {selected ? <Ionicons name="checkmark" size={18} color="#1D1A33" /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- Shared keypad ---------------- */

function Keypad(props: {
  onKey: (k: string) => void;
  onClear: () => void;
  onBack: () => void;
  onEquals: () => void;
  onHistory: () => void;
}) {
  type K = { label: string; kind: 'fn' | 'num' | 'op'; on: () => void; icon?: keyof typeof Ionicons.glyphMap };
  const n = (d: string): K => ({ label: d, kind: 'num', on: () => props.onKey(d) });
  const o = (d: string): K => ({ label: d, kind: 'op', on: () => props.onKey(d) });
  const rows: K[][] = [
    [
      { label: 'AC', kind: 'fn', on: props.onClear },
      { label: 'back', kind: 'fn', on: props.onBack, icon: 'backspace-outline' },
      { label: '%', kind: 'fn', on: () => props.onKey('%') },
      o('÷'),
    ],
    [n('7'), n('8'), n('9'), o('×')],
    [n('4'), n('5'), n('6'), o('−')],
    [n('1'), n('2'), n('3'), o('+')],
    [
      { label: 'history', kind: 'fn', on: props.onHistory, icon: 'time-outline' },
      n('0'),
      n('.'),
      { label: '=', kind: 'op', on: props.onEquals },
    ],
  ];
  return (
    <View style={styles.pad}>
      {rows.map((row, r) => (
        <View key={r} style={styles.padRow}>
          {row.map((k) => (
            <TouchableOpacity
              key={k.label}
              style={[styles.key, k.kind === 'num' && styles.keyNum, k.kind === 'op' && styles.keyOp]}
              onPress={k.on}
              activeOpacity={0.6}
              accessibilityLabel={k.label}
            >
              {k.icon ? (
                <Ionicons name={k.icon} size={24} color="#1D1A33" />
              ) : (
                <Text style={[styles.keyText, k.kind === 'op' && { color: '#FFF' }]}>{k.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  roundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4EFFF', alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', backgroundColor: '#F4EFFF', borderRadius: 12, padding: 3 },
  segBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 9 },
  segActive: { backgroundColor: '#6A4CFF' },
  segText: { fontSize: 14, fontWeight: '700', color: '#6B6585' },
  segTextActive: { color: '#FFFFFF' },

  display: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 8, minHeight: 120 },
  exprScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  expr: { fontSize: 22, color: '#6B6585', textAlign: 'right' },
  result: { fontSize: 52, fontWeight: '700', color: '#1D1A33', textAlign: 'right', marginTop: 4 },
  preview: { fontSize: 30, fontWeight: '600', color: '#ADA7C2' },
  explain: {
    alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: '#F4EFFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6,
  },
  explainText: { fontSize: 13, fontWeight: '700', color: '#1D1A33' },

  sciPad: { paddingHorizontal: 12, gap: 6, marginBottom: 6 },
  sciRow: { flexDirection: 'row', gap: 6 },
  sciKey: { flex: 1, height: 40, borderRadius: 10, backgroundColor: '#FBF8FF', alignItems: 'center', justifyContent: 'center' },
  sciKeyOn: { backgroundColor: '#ECE6F8' },
  sciText: { fontSize: 15, fontWeight: '600', color: '#48484A' },

  pad: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  padRow: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 58, borderRadius: 16, backgroundColor: '#F4EFFF', alignItems: 'center', justifyContent: 'center' },
  keyNum: { backgroundColor: '#ECE6F8' },
  keyOp: { backgroundColor: '#6A4CFF' },
  keyText: { fontSize: 24, fontWeight: '700', color: '#1D1A33' },

  catBar: { flexGrow: 0, marginTop: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F4EFFF' },
  catChipOn: { backgroundColor: '#6A4CFF' },
  catText: { fontSize: 13, fontWeight: '700', color: '#48484A' },
  convBox: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  convRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 8 },
  convValue: { flex: 1, fontSize: 48, fontWeight: '700', color: '#1D1A33', textAlign: 'right' },
  unitBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 10, minWidth: 64 },
  unitText: { fontSize: 18, color: '#6B6585', fontWeight: '600' },
  convMid: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 },
  swap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4EFFF', alignItems: 'center', justifyContent: 'center' },
  convLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1D1A33' },
  clear: { fontSize: 14, fontWeight: '700', color: '#FF3B30' },
  empty: { fontSize: 14, color: '#6B6585', paddingVertical: 16 },
  histRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(106,76,255,0.10)', alignItems: 'flex-end' },
  histExpr: { fontSize: 14, color: '#6B6585' },
  histResult: { fontSize: 18, fontWeight: '700', color: '#1D1A33', marginTop: 2 },
  unitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(106,76,255,0.10)' },
  unitRowText: { fontSize: 16, color: '#1D1A33' },
});
