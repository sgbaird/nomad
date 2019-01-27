import React from 'react'
import PropTypes from 'prop-types'
import { withStyles, LinearProgress } from '@material-ui/core'
import ReactJson from 'react-json-view'
import { compose } from 'recompose'
import { withErrors } from './errors'
import Markdown from './Markdown'
import { withApi } from './api'

class ArchiveCalcView extends React.Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    raiseError: PropTypes.func.isRequired,
    uploadId: PropTypes.string.isRequired,
    calcId: PropTypes.string.isRequired
  }

  static styles = theme => ({
    root: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    },
    metaInfo: {
      flex: '0 0 auto',
      overflowY: 'auto'
    },
    data: {
      flex: '1 1',
      overflowY: 'auto'
    }
  });

  constructor(props) {
    super(props)
    this.state = {
      data: null,
      metaInfo: null,
      showMetaInfo: false
    }
  }

  componentDidMount() {
    const {uploadId, calcId, api} = this.props
    api.archive(uploadId, calcId).then(data => {
      this.setState({data: data})
    }).catch(error => {
      this.setState({data: null})
      this.props.raiseError(error)
    })

    api.getMetaInfo().then(metaInfo => {
      this.setState({metaInfo: metaInfo})
    }).catch(error => {
      this.props.raiseError(error)
    })
  }

  handleShowMetaInfo(selection, more) {
    if (selection.name === '_name') {
      this.setState({showMetaInfo: selection.value})
    } else {
      this.setState({showMetaInfo: selection.name})
    }
  }

  render() {
    const { classes } = this.props
    const { data, showMetaInfo, metaInfo } = this.state
    const metaInfoData = metaInfo ? metaInfo[showMetaInfo] : null

    return (
      <div className={classes.root}>
        <div className={classes.data}>{
          data
            ? <ReactJson
              src={this.state.data}
              enableClipboard={false}
              collapsed={4}
              displayObjectSize={false}
              onSelect={this.handleShowMetaInfo.bind(this)} />
            : <LinearProgress variant="query" />
        }</div>
        <div className={classes.metaInfo}>{
          showMetaInfo && metaInfo
            ? metaInfoData
              ? <Markdown>{`**${metaInfoData.name}**: ${metaInfoData.description}`}</Markdown>
              : <Markdown>This value has **no** *meta-info* attached to it.</Markdown>
            : <Markdown>Click a value to show its *meta-info*!</Markdown>
        }
        </div>
      </div>
    )
  }
}

export default compose(withApi(false), withErrors, withStyles(ArchiveCalcView.styles))(ArchiveCalcView)
