import React, { useState } from 'react'
import styled from 'styled-components'
import {
  Diff as RDiff,
  Hunk,
  markEdits,
  tokenize,
  pickRanges
} from 'react-diff-view'
import flatMap from 'lodash.flatmap'
import DiffHeader from './DiffHeader'
import { getComments } from './DiffComment'

const Container = styled.div`
  border: 1px solid #ddd;
  border-radius: 3px;
  margin-bottom: 16px;
  margin-top: 16px;
`

const DiffView = styled(RDiff)`
  .diff-gutter-col {
    width: 30px;
  }

  tr.diff-line {
    font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier,
      monospace;
  }

  td.diff-gutter {
    color: rgba(27, 31, 35, 0.3);
    padding: 0;
    text-align: center;
    font-size: 12px;
    cursor: auto;
  }

  td.diff-gutter .diff-line-normal {
    background-color: #cdffd8;
    border-color: #bef5cb;
  }

  td.diff-gutter:hover {
    cursor: pointer;
    color: rgba(27, 31, 35, 0.6);
  }

  td.diff-code {
    font-size: 12px;
    color: #24292e;
  }

  td.diff-code-insert .diff-code-edit {
    background-color: #acf2bd;
  }

  td .diff-whitespace-change .diff-code-edit {
    background-color: transparent;
  }

  td.diff-gutter-omit:before {
    width: 0;
    background-color: transparent;
  }
`

// Diff will be collapsed by default if the file has been deleted or has more than 5 hunks
const isDiffCollapsedByDefault = ({ type, hunks }) =>
  type === 'delete' || hunks.length > 5 ? true : undefined

// Visually hiding whitespace changes
// More details: https://github.com/otakustay/react-diff-view/issues/65#issuecomment-535414888
const TOKEN_TYPE_SPACE = 'space'

const findLeadingRange = change => {
  const [spaces] = /^\s*/.exec(change.content)
  return spaces
    ? {
        type: TOKEN_TYPE_SPACE,
        lineNumber: change.lineNumber,
        start: 0,
        length: spaces.length,
        properties: { value: spaces }
      }
    : null
}

const findTrailingRange = change => {
  const [spaces] = /\s*$/.exec(change.content)
  return spaces
    ? {
        type: TOKEN_TYPE_SPACE,
        lineNumber: change.lineNumber,
        start: change.content.length - spaces.length,
        length: spaces.length,
        properties: { value: spaces }
      }
    : null
}

const pickLeadingAndTrailingSpaces = hunks => {
  const changes = flatMap(hunks, hunk => hunk.changes)
  const [oldRanges, newRanges] = changes.reduce(
    ([oldRanges, newRanges], change) => {
      const leadingRange = findLeadingRange(change)
      const trailingRange = findTrailingRange(change)
      const pushRange = ranges => {
        leadingRange && ranges.push(leadingRange)
        trailingRange && ranges.push(trailingRange)
      }

      if (!change.isInsert) {
        pushRange(oldRanges)
      }
      if (!change.isDelete) {
        pushRange(newRanges)
      }

      return [oldRanges, newRanges]
    },
    [[], []]
  )
  return pickRanges(oldRanges, newRanges)
}

const renderToken = (token, defaultRender, i) => {
  switch (token.type) {
    case TOKEN_TYPE_SPACE:
      return (
        <span key={i} className="diff-whitespace-change">
          {token.children &&
            token.children.map((token, i) =>
              renderToken(token, defaultRender, i)
            )}
        </span>
      )
    default:
      return defaultRender(token, i)
  }
}

const Diff = ({
  oldPath,
  newPath,
  type,
  hunks,
  fromVersion,
  toVersion,
  diffKey,
  isDiffCompleted,
  onCompleteDiff,
  selectedChanges,
  onToggleChangeSelection,
  areAllCollapsed,
  setAllCollapsed,
  diffViewStyle,
  highlightWhitespaceChanges
}) => {
  const [isDiffCollapsed, setIsDiffCollapsed] = useState(
    isDiffCollapsedByDefault({ type, hunks })
  )

  if (areAllCollapsed !== undefined && areAllCollapsed !== isDiffCollapsed) {
    setIsDiffCollapsed(areAllCollapsed)
  } else if (isDiffCompleted && isDiffCollapsed === undefined) {
    setIsDiffCollapsed(true)
  }

  return (
    <Container>
      <DiffHeader
        oldPath={oldPath}
        newPath={newPath}
        toVersion={toVersion}
        type={type}
        diffKey={diffKey}
        hasDiff={hunks.length > 0}
        isDiffCollapsed={isDiffCollapsed}
        setIsDiffCollapsed={(collapse, altKey) => {
          if (altKey) {
            return setAllCollapsed(collapse)
          }

          setAllCollapsed(undefined)
          setIsDiffCollapsed(collapse)
        }}
        isDiffCompleted={isDiffCompleted}
        onCompleteDiff={onCompleteDiff}
      />

      {!isDiffCollapsed && (
        <DiffView
          viewType={diffViewStyle}
          diffType={type}
          hunks={hunks}
          widgets={getComments({ newPath, fromVersion, toVersion })}
          optimizeSelection={true}
          selectedChanges={selectedChanges}
          renderToken={renderToken}
        >
          {hunks => {
            const enhancers = [markEdits(hunks)]

            if (!highlightWhitespaceChanges) {
              enhancers.push(pickLeadingAndTrailingSpaces(hunks))
            }

            const options = {
              highlight: false,
              enhancers: enhancers
            }

            const tokens = tokenize(hunks, options)

            return hunks.map(hunk => (
              <Hunk
                key={hunk.content}
                hunk={hunk}
                tokens={tokens}
                gutterEvents={{ onClick: onToggleChangeSelection }}
              />
            ))
          }}
        </DiffView>
      )}
    </Container>
  )
}

/*
  Return true if passing `nextProps` to render would return
  the same result as passing prevProps to render, otherwise return false
*/
const arePropsEqual = (prevProps, nextProps) =>
  prevProps.isDiffCompleted === nextProps.isDiffCompleted &&
  prevProps.areAllCollapsed === nextProps.areAllCollapsed &&
  prevProps.diffViewStyle === nextProps.diffViewStyle &&
  prevProps.highlightWhitespaceChanges === nextProps.highlightWhitespaceChanges

export default React.memo(Diff, arePropsEqual)
