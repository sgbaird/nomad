import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useRecoilValue } from 'recoil'
import Adaptor from './adaptors'
import { Item, Content, Compartment, filterConfigState } from './ArchiveBrowser'
import { Typography, Box, IconButton } from '@material-ui/core'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import { resolveRef, sectionDefs } from './metainfo'
import { Definition, metainfoAdaptorFactory } from './metainfoAdaptors'

export default function archiveAdaptorFactory(data, sectionDef) {
  return new SectionAdaptor(data, sectionDef || sectionDefs['EntryArchive'], {archive: data})
}

class ArchiveAdaptor extends Adaptor {
  constructor(obj, def, context) {
    super(obj)
    this.def = def
    this.context = context
  }

  adaptorFactory(obj, def, context) {
    if (def.m_def === 'Section') {
      return new SectionAdaptor(obj, def, context || this.context)
    } else if (def.m_def === 'SubSection') {
      return new SubSectionAdaptor(obj, def, context || this.context)
    } else if (def.m_def === 'Quantity') {
      return new QuantityAdaptor(obj, def, context || this.context)
    }
  }

  itemAdaptor(key) {
    if (key === '_metainfo') {
      return metainfoAdaptorFactory(this.def)
    } else {
      throw new Error('Unknown item key')
    }
  }
}

export class SectionAdaptor extends ArchiveAdaptor {
  itemAdaptor(key) {
    const property = this.def._properties[key]
    const value = this.e[key]
    if (!property) {
      return super.itemAdaptor(key)
    } else if (property.m_def === 'SubSection') {
      const sectionDef = resolveRef(property.sub_section)
      if (Array.isArray(value)) {
        if (value.length === 1) {
          return this.adaptorFactory(value[0], sectionDef)
        } else {
          return this.adaptorFactory(value, property)
        }
      } else {
        return this.adaptorFactory(value, sectionDef)
      }
    } else if (property.m_def === 'Quantity') {
      if (property.type.type_kind === 'reference' && property.shape.length === 0) {
        return this.adaptorFactory(resolveRef(value, this.context.archive), resolveRef(property.type.type_data))
      }
      return this.adaptorFactory(value, property)
    } else {
      throw new Error('Unknown metainfo meta definition')
    }
  }
  render() {
    return <Section section={this.e} def={this.def} />
  }
}

class QuantityAdaptor extends ArchiveAdaptor {
  render() {
    return <Quantity value={this.e} def={this.def} />
  }
}

class SubSectionAdaptor extends ArchiveAdaptor {
  itemAdaptor(key) {
    const sectionDef = resolveRef(this.def.sub_section)
    return this.adaptorFactory(this.e[key], sectionDef)
  }
  render() {
    return <SubSection sections={this.e} def={this.def} />
  }
}

function QuantityItemPreview({value, def}) {
  if (def.type.type_kind === 'reference') {
    return <Box component="span" fontStyle="italic">
      <Typography component="span">reference ...</Typography>
    </Box>
  }
  if (def.shape.length > 0) {
    const dimensions = []
    let current = value
    for (let i = 0; i < def.shape.length; i++) {
      dimensions.push(current.length)
      current = current[0]
    }
    let typeLabel
    if (def.type.type_kind === 'python') {
      typeLabel = 'list'
    } else {
      if (dimensions.length === 1) {
        typeLabel = 'vector'
      } else if (dimensions.length === 2) {
        typeLabel = 'matrix'
      } else {
        typeLabel = 'tensor'
      }
    }
    return <Box component="span" whiteSpace="nowrap" fontStyle="italic">
      <Typography component="span">{`[${dimensions.join(', ')}] ${typeLabel}`}</Typography>
    </Box>
  } else {
    return <Box component="span" whiteSpace="nowarp">
      <Typography component="span">{String(value)}</Typography>
    </Box>
  }
}
QuantityItemPreview.propTypes = ({
  value: PropTypes.any,
  def: PropTypes.object.isRequired
})

function QuantityValue({value, def}) {
  return <Box
    marginTop={2} marginBottom={2} textAlign="center" fontWeight="bold"
  >
    <Typography>
      {String(value)}
    </Typography>
  </Box>
}
QuantityValue.propTypes = ({
  value: PropTypes.any,
  def: PropTypes.object.isRequired
})

function Section({section, def}) {
  const filterConfig = useRecoilValue(filterConfigState)
  const filter = filterConfig.showCodeSpecific ? def => true : def => !def.name.startsWith('x_')
  return <Content>
    <Compartment>
      <Definition def={def} />
    </Compartment>
    <Compartment title="sub sections">
      {def.sub_sections
        .filter(subSectionDef => section[subSectionDef.name])
        .filter(filter)
        .map(subSectionDef => {
          const key = subSectionDef.name
          return <Item key={key} itemKey={key}>
            <Typography component="span">
              <Box fontWeight="bold" component="span">
                {subSectionDef.name}
              </Box>
              {subSectionDef.repeats ? ` (${section[subSectionDef.name].length})` : ''}
            </Typography>
          </Item>
        })
      }
    </Compartment>
    <Compartment title="quantities">
      {def.quantities
        .filter(quantityDef => section[quantityDef.name])
        .filter(filter)
        .map(quantityDef => {
          const key = quantityDef.name
          return <Item key={key} itemKey={key}>
            <Box component="span" whiteSpace="nowrap">
              <Typography component="span">
                <Box fontWeight="bold" component="span">
                  {quantityDef.name}
                </Box>
              </Typography> = <QuantityItemPreview value={section[quantityDef.name]} def={quantityDef} />
            </Box>
          </Item>
        })
      }
    </Compartment>
  </Content>
}
Section.propTypes = ({
  section: PropTypes.object.isRequired,
  def: PropTypes.object.isRequired
})

function SubSection({sections, def}) {
  const [showAll, setShowAll] = useState(false)
  const length = sections.length

  const renderItem = (section, index) => (
    <Item key={index} itemKey={index.toString()}>
      <Typography><Box component="span" fontWeight="bold">{index}</Box></Typography>
    </Item>
  )

  if (length <= 5 || showAll) {
    return <Content>{sections.map(renderItem)}</Content>
  } else {
    return <Content>
      {sections.slice(0, 3).map(renderItem)}
      <Box marginLeft={3} marginTop={1} marginBottom={1}>
        <IconButton onClick={() => setShowAll(true)}>
          <MoreVertIcon />
        </IconButton>
      </Box>
      {sections.slice(length - 2, length).map((section, index) => renderItem(section, index + length - 2))}
    </Content>
  }
}
SubSection.propTypes = ({
  sections: PropTypes.arrayOf(PropTypes.object).isRequired,
  def: PropTypes.object.isRequired
})

function Quantity({value, def}) {
  return <Content>
    <Definition def={def} />
    <QuantityValue value={value} def={def} />
  </Content>
}
Quantity.propTypes = ({
  value: PropTypes.any,
  def: PropTypes.object.isRequired
})
