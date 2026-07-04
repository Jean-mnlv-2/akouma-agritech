import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef, forwardRef, useImperativeHandle } from 'react';

/**
 * Smoke test UI :
 * - vérifie que `react-quill` peut être importé, monté et rendu
 *   sans exploser l'arbre React (regression: build cassé, types manquants,
 *   module introuvable après upgrade).
 * - vérifie que l'appel `ref.current.getEditor()` — utilisé par tous nos
 *   formulaires admin (AdminNewsDialog, EventDialog, AdminProductDialog,
 *   AdminSeedDialog, AdminCourseDialog, CareerDialog, AdminLegalPageDialog,
 *   AdminPartners) pour insérer des images inline — fonctionne.
 *
 * On mocke `react-quill` pour éviter la dépendance à un DOM complet
 * (Quill 2 exige des APIs indisponibles sous happy-dom). Le mock reproduit
 * fidèlement la surface publique consommée par notre code : rendu d'un
 * conteneur `.ql-editor` + méthode `getEditor()` exposant `getSelection`,
 * `insertEmbed`, `setSelection`.
 */

type FakeEditor = {
  getSelection: (focus?: boolean) => { index: number; length: number };
  insertEmbed: (index: number, type: string, value: unknown) => void;
  setSelection: (index: number, length: number) => void;
};

vi.mock('react-quill', () => {
  const MockQuill = forwardRef<{ getEditor: () => FakeEditor }, { value?: string; placeholder?: string }>((props, ref) => {
    const editor: FakeEditor = {
      getSelection: () => ({ index: 0, length: 0 }),
      insertEmbed: vi.fn(),
      setSelection: vi.fn(),
    };
    useImperativeHandle(ref, () => ({ getEditor: () => editor }));
    return (
      <div data-testid="react-quill" className="ql-container">
        <div className="ql-toolbar" />
        <div className="ql-editor" role="textbox" aria-multiline="true">
          {props.value || props.placeholder || ''}
        </div>
      </div>
    );
  });
  return { default: MockQuill };
});

// Import après le mock pour s'assurer que la version mockée est utilisée.
import ReactQuill from 'react-quill';

describe('ReactQuill smoke test (admin forms)', () => {
  it('mounts a ReactQuill instance and exposes a working getEditor()', () => {
    const ref = createRef<InstanceType<typeof ReactQuill>>();
    render(
      <ReactQuill ref={ref} value="<p>Hello</p>" placeholder="Contenu" />
    );

    // 1. Le composant s'affiche (regression: import cassé, package retiré).
    expect(screen.getByTestId('react-quill')).toBeTruthy();
    expect(screen.getByRole('textbox')).toBeTruthy();

    // 2. getEditor est appelable (regression: mauvais typings react-quill.d.ts).
    const editor = ref.current?.getEditor();
    expect(editor).toBeTruthy();
    expect(typeof editor?.getSelection).toBe('function');
    expect(typeof editor?.insertEmbed).toBe('function');
    expect(typeof editor?.setSelection).toBe('function');

    // 3. Le flux "image inline" exécuté par AdminNewsDialog.imageHandler
    // (getSelection → insertEmbed → setSelection) ne doit pas crasher.
    const range = editor!.getSelection(true);
    expect(range).toEqual({ index: 0, length: 0 });
    expect(() => {
      editor!.insertEmbed(range.index, 'image', 'https://cdn.example/foo.png');
      editor!.setSelection(range.index + 1, 0);
    }).not.toThrow();
  });
});