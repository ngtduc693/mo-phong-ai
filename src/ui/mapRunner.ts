import { isLevelImplemented } from '../engine/levelLoader';
import { isStorageAvailable, loadProgress, setUnlockAll } from '../engine/storage';
import { WORLD1 } from '../levels/world1';
import { t } from '../i18n';
import { el } from './dom';
import type { MapLevel } from '../scenes/WorldMapScene';

type Mounted = { ready: Promise<void>; destroy(): void };

function computeLevels(unlockedAll: boolean): MapLevel[] {
  const progress = loadProgress();
  return WORLD1.map((level) => {
    const previous = WORLD1.find((l) => l.order === level.order - 1);
    const previousStars = previous ? (progress.levels[previous.id]?.stars ?? 0) : 0;
    const unlocked = level.order === 1 || unlockedAll || previousStars > 0;
    return {
      id: level.id,
      title: level.title,
      locked: !unlocked,
      implemented: isLevelImplemented(level.id),
      stars: progress.levels[level.id]?.stars ?? 0,
    };
  });
}

export async function startMapPage(stage: HTMLElement, toolbar: HTMLElement): Promise<void> {
  const progress = loadProgress();
  let game: Mounted | null = null;
  const { mountWorldMap } = await import('../scenes/mount');

  async function render(unlockedAll: boolean): Promise<void> {
    if (game) game.destroy();
    stage.replaceChildren();
    stage.setAttribute('tabindex', '0');
    game = mountWorldMap(stage, {
      levels: computeLevels(unlockedAll),
      onSelect: (id) => {
        const level = WORLD1.find((l) => l.id === id);
        if (level) window.location.href = `/thuat-toan/${level.slug}/`;
      },
    });
    await game.ready;
  }

  await render(progress.unlockedAll);

  const checkbox = el('input', {
    attrs: { type: 'checkbox', id: 'unlock-all', checked: progress.unlockedAll },
  });
  checkbox.addEventListener('change', () => {
    const next = setUnlockAll(checkbox.checked);
    void render(next.unlockedAll);
  });

  toolbar.replaceChildren(
    el('label', {
      className: 'switch',
      attrs: { for: 'unlock-all' },
      children: [checkbox, t('map.unlockAll')],
    }),
    el('span', { className: 'muted', text: t('map.unlockAllHint') }),
  );

  if (!isStorageAvailable()) {
    toolbar.append(el('p', { className: 'muted', text: t('storage.blocked') }));
  }

  window.addEventListener('pagehide', () => game?.destroy());
}
